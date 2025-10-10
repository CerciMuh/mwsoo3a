/**
 * Environment variable configuration
 */

export const DEGREES_TABLE = process.env.DEGREES_TABLE || 'UniversityDegrees';
export const COURSES_TABLE = process.env.COURSES_TABLE || 'DegreeCourses';
export const NOTES_TABLE = process.env.NOTES_TABLE || 'CourseNotes';

// Cognito Configuration for JWT verification
export const USER_POOL_ID = process.env.USER_POOL_ID || '';
export const CLIENT_ID = process.env.CLIENT_ID || '';

// Legacy - kept for backwards compatibility
export const JWT_ISSUER = process.env.JWT_ISSUER || '';
