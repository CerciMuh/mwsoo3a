/**
 * Course management service
 */

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/aws-clients';
import { COURSES_TABLE } from '../config/environment';
import { Course, CreateCourseRequest, UpdateCourseRequest } from '../models/types';
import { slugify, now } from '../utils/helpers';
import { AppError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { getDegreeById } from './degree.service';

/**
 * Create a new course
 */
export async function createCourse(
  request: CreateCourseRequest,
  createdBy: string
): Promise<Course> {
  const courseSlug = slugify(request.courseName);
  const courseId = `course_${uuidv4()}`;

  // Verify degree exists
  const degree = await getDegreeById(request.degreeId);
  if (!degree) {
    throw new AppError(404, 'Degree not found');
  }

  if (!degree.active) {
    throw new AppError(400, 'Cannot add courses to inactive degree');
  }

  // Check if course already exists for this degree
  const existing = await getCourseBySlug(request.degreeId, courseSlug);
  if (existing) {
    throw new AppError(409, `Course "${request.courseName}" already exists for this degree`);
  }

  const course: Course = {
    id: courseId,
    degreeId: request.degreeId,
    universityDomain: degree.universityDomain,
    courseName: request.courseName,
    courseSlug,
    courseCode: request.courseCode,
    description: request.description,
    credits: request.credits,
    semester: request.semester,
    year: request.year,
    professor: request.professor,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    noteCount: 0,
    active: true,
  };

  await docClient.send(
    new PutCommand({
      TableName: COURSES_TABLE,
      Item: course,
    })
  );

  // TODO: Increment courseCount in UniversityDegrees table
  // This will be done in a future update

  return course;
}

/**
 * Get course by degreeId and slug
 */
async function getCourseBySlug(
  degreeId: string,
  courseSlug: string
): Promise<Course | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: COURSES_TABLE,
      Key: {
        degreeId,
        courseSlug,
      },
    })
  );

  return result.Item as Course | null;
}

/**
 * Get course by ID
 */
export async function getCourseById(courseId: string): Promise<Course | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: COURSES_TABLE,
      IndexName: 'courseId-index',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': courseId,
      },
    })
  );

  return result.Items && result.Items.length > 0 ? (result.Items[0] as Course) : null;
}

/**
 * List courses for a degree
 */
export async function listCoursesByDegree(degreeId: string): Promise<Course[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: COURSES_TABLE,
      KeyConditionExpression: 'degreeId = :degreeId',
      ExpressionAttributeValues: {
        ':degreeId': degreeId,
      },
    })
  );

  return (result.Items || []) as Course[];
}

/**
 * List courses by university
 */
export async function listCoursesByUniversity(universityDomain: string): Promise<Course[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: COURSES_TABLE,
      IndexName: 'universityDomain-courseCode-index',
      KeyConditionExpression: 'universityDomain = :domain',
      ExpressionAttributeValues: {
        ':domain': universityDomain,
      },
    })
  );

  return (result.Items || []) as Course[];
}

/**
 * Get course by university and course code
 */
export async function getCourseByCode(
  universityDomain: string,
  courseCode: string
): Promise<Course | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: COURSES_TABLE,
      IndexName: 'universityDomain-courseCode-index',
      KeyConditionExpression: 'universityDomain = :domain AND courseCode = :code',
      ExpressionAttributeValues: {
        ':domain': universityDomain,
        ':code': courseCode,
      },
    })
  );

  return result.Items && result.Items.length > 0 ? (result.Items[0] as Course) : null;
}

/**
 * Update course
 */
export async function updateCourse(
  courseId: string,
  updates: UpdateCourseRequest
): Promise<Course> {
  const existing = await getCourseById(courseId);
  if (!existing) {
    throw new AppError(404, 'Course not found');
  }

  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  // Build update expression
  if (updates.courseName !== undefined) {
    updateExpressions.push('#courseName = :courseName');
    updateExpressions.push('#courseSlug = :courseSlug');
    expressionAttributeNames['#courseName'] = 'courseName';
    expressionAttributeNames['#courseSlug'] = 'courseSlug';
    expressionAttributeValues[':courseName'] = updates.courseName;
    expressionAttributeValues[':courseSlug'] = slugify(updates.courseName);
  }

  if (updates.courseCode !== undefined) {
    updateExpressions.push('#courseCode = :courseCode');
    expressionAttributeNames['#courseCode'] = 'courseCode';
    expressionAttributeValues[':courseCode'] = updates.courseCode;
  }

  if (updates.description !== undefined) {
    updateExpressions.push('#description = :description');
    expressionAttributeNames['#description'] = 'description';
    expressionAttributeValues[':description'] = updates.description;
  }

  if (updates.credits !== undefined) {
    updateExpressions.push('#credits = :credits');
    expressionAttributeNames['#credits'] = 'credits';
    expressionAttributeValues[':credits'] = updates.credits;
  }

  if (updates.semester !== undefined) {
    updateExpressions.push('#semester = :semester');
    expressionAttributeNames['#semester'] = 'semester';
    expressionAttributeValues[':semester'] = updates.semester;
  }

  if (updates.year !== undefined) {
    updateExpressions.push('#year = :year');
    expressionAttributeNames['#year'] = 'year';
    expressionAttributeValues[':year'] = updates.year;
  }

  if (updates.professor !== undefined) {
    updateExpressions.push('#professor = :professor');
    expressionAttributeNames['#professor'] = 'professor';
    expressionAttributeValues[':professor'] = updates.professor;
  }

  if (updates.active !== undefined) {
    updateExpressions.push('#active = :active');
    expressionAttributeNames['#active'] = 'active';
    expressionAttributeValues[':active'] = updates.active;
  }

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = now();

  await docClient.send(
    new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: {
        degreeId: existing.degreeId,
        courseSlug: existing.courseSlug,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  // Return updated course
  return getCourseById(courseId) as Promise<Course>;
}

/**
 * Delete course (soft delete)
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const existing = await getCourseById(courseId);
  if (!existing) {
    throw new AppError(404, 'Course not found');
  }

  if (existing.noteCount > 0) {
    throw new AppError(400, 'Cannot delete course with existing notes');
  }

  await docClient.send(
    new UpdateCommand({
      TableName: COURSES_TABLE,
      Key: {
        degreeId: existing.degreeId,
        courseSlug: existing.courseSlug,
      },
      UpdateExpression: 'SET #active = :active, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#active': 'active',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':active': false,
        ':updatedAt': now(),
      },
    })
  );

  // TODO: Decrement courseCount in UniversityDegrees table
  // This will be done in a future update
}
