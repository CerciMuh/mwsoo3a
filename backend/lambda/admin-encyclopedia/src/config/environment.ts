/**
 * Environment variables and configuration
 */

// DynamoDB table names
export const DEGREES_TABLE = process.env.DEGREES_TABLE || 'UniversityDegrees';
export const COURSES_TABLE = process.env.COURSES_TABLE || 'DegreeCourses';
export const NOTES_TABLE = process.env.NOTES_TABLE || 'CourseNotes';

// AWS Region
export const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
