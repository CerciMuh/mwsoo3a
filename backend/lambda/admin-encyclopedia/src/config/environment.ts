/**
 * Environment variables and configuration
 */

// DynamoDB table names
export const DEGREES_TABLE = process.env.DEGREES_TABLE || 'UniversityDegrees';
export const COURSES_TABLE = process.env.COURSES_TABLE || 'DegreeCourses';
export const NOTES_TABLE = process.env.NOTES_TABLE || 'CourseNotes';

// AWS Region
export const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';

// Cognito Configuration
export const USER_POOL_ID = process.env.USER_POOL_ID || '';
export const CLIENT_ID = process.env.CLIENT_ID || '';
