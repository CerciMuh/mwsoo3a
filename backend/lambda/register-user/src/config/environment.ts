/**
 * Environment configuration and validation
 */

export const USER_POOL_ID = process.env.USER_POOL_ID;
export const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
export const REGION = process.env.AWS_REGION; // Automatically set by AWS Lambda

// Validate required environment variables
if (!USER_POOL_ID || !DYNAMODB_TABLE) {
  throw new Error('Missing required environment variables: USER_POOL_ID, DYNAMODB_TABLE');
}

if (!REGION) {
  throw new Error('AWS_REGION not set (this should never happen in Lambda)');
}
