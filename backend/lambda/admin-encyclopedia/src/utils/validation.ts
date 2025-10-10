/**
 * Input validation utilities
 */

import { AppError } from './errors';
import { CreateDegreeRequest, UpdateDegreeRequest, CreateCourseRequest, UpdateCourseRequest, DegreeType } from '../models/types';

const VALID_DEGREE_TYPES: DegreeType[] = ['undergraduate', 'postgraduate', 'doctorate', 'certificate'];

/**
 * Validate CreateDegreeRequest
 */
export function validateCreateDegreeRequest(request: CreateDegreeRequest): void {
  // Validate degree name
  if (!request.degreeName || typeof request.degreeName !== 'string' || request.degreeName.trim().length === 0) {
    throw new AppError(400, 'Degree name is required');
  }

  if (request.degreeName.length > 200) {
    throw new AppError(400, 'Degree name must be less than 200 characters');
  }

  // Validate university domain
  if (!request.universityDomain || typeof request.universityDomain !== 'string') {
    throw new AppError(400, 'University domain is required');
  }

  // Validate description if provided
  if (request.description && request.description.length > 2000) {
    throw new AppError(400, 'Description must be less than 2000 characters');
  }

  // Validate degree type
  if (request.degreeType && !VALID_DEGREE_TYPES.includes(request.degreeType)) {
    throw new AppError(400, `Invalid degree type. Must be one of: ${VALID_DEGREE_TYPES.join(', ')}`);
  }
}

/**
 * Validate UpdateDegreeRequest
 */
export function validateUpdateDegreeRequest(request: UpdateDegreeRequest): void {
  // Validate degree name if provided
  if (request.degreeName !== undefined) {
    if (typeof request.degreeName !== 'string' || request.degreeName.trim().length === 0) {
      throw new AppError(400, 'Degree name cannot be empty');
    }

    if (request.degreeName.length > 200) {
      throw new AppError(400, 'Degree name must be less than 200 characters');
    }
  }

  // Validate description if provided
  if (request.description !== undefined && request.description.length > 2000) {
    throw new AppError(400, 'Description must be less than 2000 characters');
  }

  // Validate degree type if provided
  if (request.degreeType !== undefined && !VALID_DEGREE_TYPES.includes(request.degreeType)) {
    throw new AppError(400, `Invalid degree type. Must be one of: ${VALID_DEGREE_TYPES.join(', ')}`);
  }
}

/**
 * Validate CreateCourseRequest
 */
export function validateCreateCourseRequest(request: CreateCourseRequest): void {
  // Validate degreeId
  if (!request.degreeId || typeof request.degreeId !== 'string') {
    throw new AppError(400, 'Degree ID is required');
  }

  // Validate course name
  if (!request.courseName || typeof request.courseName !== 'string' || request.courseName.trim().length === 0) {
    throw new AppError(400, 'Course name is required');
  }

  if (request.courseName.length > 200) {
    throw new AppError(400, 'Course name must be less than 200 characters');
  }

  // Validate course code
  if (!request.courseCode || typeof request.courseCode !== 'string' || request.courseCode.trim().length === 0) {
    throw new AppError(400, 'Course code is required');
  }

  if (request.courseCode.length > 50) {
    throw new AppError(400, 'Course code must be less than 50 characters');
  }

  // Validate description if provided
  if (request.description && request.description.length > 2000) {
    throw new AppError(400, 'Description must be less than 2000 characters');
  }

  // Validate credits if provided
  if (request.credits !== undefined) {
    if (typeof request.credits !== 'number' || request.credits < 0 || request.credits > 100) {
      throw new AppError(400, 'Credits must be a number between 0 and 100');
    }
  }

  // Validate year if provided
  if (request.year !== undefined) {
    if (typeof request.year !== 'number' || request.year < 1 || request.year > 10) {
      throw new AppError(400, 'Year must be a number between 1 and 10');
    }
  }

  // Validate semester if provided
  const validSemesters = ['fall', 'spring', 'summer', 'full-year'];
  if (request.semester && !validSemesters.includes(request.semester)) {
    throw new AppError(400, `Invalid semester. Must be one of: ${validSemesters.join(', ')}`);
  }
}

/**
 * Validate UpdateCourseRequest
 */
export function validateUpdateCourseRequest(request: UpdateCourseRequest): void {
  // Validate course name if provided
  if (request.courseName !== undefined) {
    if (typeof request.courseName !== 'string' || request.courseName.trim().length === 0) {
      throw new AppError(400, 'Course name cannot be empty');
    }

    if (request.courseName.length > 200) {
      throw new AppError(400, 'Course name must be less than 200 characters');
    }
  }

  // Validate course code if provided
  if (request.courseCode !== undefined) {
    if (typeof request.courseCode !== 'string' || request.courseCode.trim().length === 0) {
      throw new AppError(400, 'Course code cannot be empty');
    }

    if (request.courseCode.length > 50) {
      throw new AppError(400, 'Course code must be less than 50 characters');
    }
  }

  // Validate description if provided
  if (request.description !== undefined && request.description.length > 2000) {
    throw new AppError(400, 'Description must be less than 2000 characters');
  }

  // Validate credits if provided
  if (request.credits !== undefined) {
    if (typeof request.credits !== 'number' || request.credits < 0 || request.credits > 100) {
      throw new AppError(400, 'Credits must be a number between 0 and 100');
    }
  }

  // Validate year if provided
  if (request.year !== undefined) {
    if (typeof request.year !== 'number' || request.year < 1 || request.year > 10) {
      throw new AppError(400, 'Year must be a number between 1 and 10');
    }
  }

  // Validate semester if provided
  const validSemesters = ['fall', 'spring', 'summer', 'full-year'];
  if (request.semester !== undefined && !validSemesters.includes(request.semester)) {
    throw new AppError(400, `Invalid semester. Must be one of: ${validSemesters.join(', ')}`);
  }
}
