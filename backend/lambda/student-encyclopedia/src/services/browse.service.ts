/**
 * Browse service for students
 * All queries are filtered by student's universityDomain
 */

import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/aws-clients';
import { DEGREES_TABLE, COURSES_TABLE, NOTES_TABLE } from '../config/environment';
import { Degree, Course, Note } from '../models/types';
import { AppError } from '../utils/errors';

/**
 * List all active degrees for a university
 */
export async function listDegrees(universityDomain: string): Promise<Degree[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: DEGREES_TABLE,
      KeyConditionExpression: 'universityDomain = :domain',
      FilterExpression: '#active = :active',
      ExpressionAttributeNames: {
        '#active': 'active',
      },
      ExpressionAttributeValues: {
        ':domain': universityDomain,
        ':active': true,
      },
    })
  );

  return (result.Items || []) as Degree[];
}

/**
 * Get a specific degree by ID (with university validation)
 */
export async function getDegreeById(
  degreeId: string,
  universityDomain: string
): Promise<Degree> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: DEGREES_TABLE,
      IndexName: 'degreeId-index',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': degreeId,
      },
    })
  );

  const degree = result.Items && result.Items.length > 0 ? (result.Items[0] as Degree) : null;

  if (!degree) {
    throw new AppError(404, 'Degree not found');
  }

  // Validate degree belongs to student's university
  if (degree.universityDomain !== universityDomain) {
    throw new AppError(403, 'Access denied: Degree not from your university');
  }

  if (!degree.active) {
    throw new AppError(404, 'Degree not found');
  }

  return degree;
}

/**
 * List all active courses for a degree (with university validation)
 */
export async function listCoursesByDegree(
  degreeId: string,
  universityDomain: string
): Promise<Course[]> {
  // First verify the degree belongs to the student's university
  await getDegreeById(degreeId, universityDomain);

  const result = await docClient.send(
    new QueryCommand({
      TableName: COURSES_TABLE,
      KeyConditionExpression: 'degreeId = :degreeId',
      FilterExpression: '#active = :active',
      ExpressionAttributeNames: {
        '#active': 'active',
      },
      ExpressionAttributeValues: {
        ':degreeId': degreeId,
        ':active': true,
      },
    })
  );

  return (result.Items || []) as Course[];
}

/**
 * Get a specific course by ID (with university validation)
 */
export async function getCourseById(
  courseId: string,
  universityDomain: string
): Promise<Course> {
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

  const course = result.Items && result.Items.length > 0 ? (result.Items[0] as Course) : null;

  if (!course) {
    throw new AppError(404, 'Course not found');
  }

  // Validate course belongs to student's university
  if (course.universityDomain !== universityDomain) {
    throw new AppError(403, 'Access denied: Course not from your university');
  }

  if (!course.active) {
    throw new AppError(404, 'Course not found');
  }

  return course;
}

/**
 * List all active notes for a course (with university validation)
 */
export async function listNotesByCourse(
  courseId: string,
  universityDomain: string
): Promise<Note[]> {
  // First verify the course belongs to the student's university
  await getCourseById(courseId, universityDomain);

  const result = await docClient.send(
    new QueryCommand({
      TableName: NOTES_TABLE,
      KeyConditionExpression: 'courseId = :courseId',
      FilterExpression: '#active = :active',
      ExpressionAttributeNames: {
        '#active': 'active',
      },
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':active': true,
      },
    })
  );

  return (result.Items || []) as Note[];
}

/**
 * Get a specific note by ID (with university validation)
 */
export async function getNoteById(
  noteId: string,
  universityDomain: string
): Promise<Note> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: NOTES_TABLE,
      IndexName: 'noteId-index',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': noteId,
      },
    })
  );

  const note = result.Items && result.Items.length > 0 ? (result.Items[0] as Note) : null;

  if (!note) {
    throw new AppError(404, 'Note not found');
  }

  // Validate note belongs to student's university
  if (note.universityDomain !== universityDomain) {
    throw new AppError(403, 'Access denied: Note not from your university');
  }

  if (!note.active) {
    throw new AppError(404, 'Note not found');
  }

  return note;
}
