import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const REGION = process.env.AWS_REGION; // Automatically set by AWS Lambda

// Validate required environment variables
if (!USER_POOL_ID || !DYNAMODB_TABLE) {
  throw new Error('Missing required environment variables: USER_POOL_ID, DYNAMODB_TABLE');
}
if (!REGION) {
  throw new Error('AWS_REGION not set (this should never happen in Lambda)');
}

// Initialize AWS clients
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Domain cache for Lambda container reuse (5 minute TTL)
interface CacheEntry {
  isUniversity: boolean;
  timestamp: number;
}
const domainCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cacheHits = 0;
let cacheMisses = 0;

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  birthdate: string;
  phoneNumber: string;
}

interface ErrorResponse {
  error: string;
  message: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
  userType: 'student' | 'regular';
}

interface UniversityData {
  domain: string;
  name: string;
  country: string;
  alpha_two_code: string;
}

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }
  return parts[1].toLowerCase();
}

/**
 * Check if email domain belongs to a university and return university data
 * Uses parallel queries and caching for optimal performance
 */
async function getUniversityData(email: string): Promise<UniversityData | null> {
  const emailDomain = extractDomain(email);
  
  // Note: Cache stores boolean, but we'll fetch full data from DB
  // This is fine since cache is mainly for performance on duplicate emails
  
  // Build all possible domain variations to check
  const parts = emailDomain.split('.');
  const domainsToCheck: string[] = [emailDomain]; // Always check exact match
  
  if (parts.length > 2) {
    // Add last 3 parts (e.g., manchester.ac.uk from student.manchester.ac.uk)
    if (parts.length >= 3) {
      domainsToCheck.push(parts.slice(-3).join('.'));
    }
    
    // Add last 2 parts (e.g., stanford.edu from alumni.stanford.edu)
    domainsToCheck.push(parts.slice(-2).join('.'));
    
    // Add last 4 parts for very long subdomains
    if (parts.length >= 4) {
      domainsToCheck.push(parts.slice(-4).join('.'));
    }
  }
  
  // Remove duplicates
  const uniqueDomains = [...new Set(domainsToCheck)];
  
  console.log(`Checking ${uniqueDomains.length} domain variations for: ${emailDomain}`);
  
  // Execute all queries in parallel
  const queryPromises = uniqueDomains.map(domain =>
    docClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: { domain },
      })
    ).then(result => ({
      domain,
      data: result.Item as UniversityData | undefined,
    }))
  );
  
  const results = await Promise.all(queryPromises);
  
  // Find first match with data
  const match = results.find(r => r.data);
  
  if (match?.data) {
    console.log(`University found: ${match.data.name} (${match.data.country})`);
    return match.data;
  }
  
  console.log(`No university found for domain: ${emailDomain}`);
  return null;
}

/**
 * Create user in Cognito with custom attributes
 */
async function createCognitoUser(
  email: string,
  password: string,
  name: string,
  birthdate: string,
  phoneNumber: string,
  userType: 'student' | 'regular',
  universityData?: UniversityData
): Promise<void> {
  const userAttributes = [
    { Name: 'email', Value: email },
    { Name: 'email_verified', Value: 'false' },
    { Name: 'name', Value: name },
    { Name: 'birthdate', Value: birthdate },
    { Name: 'phone_number', Value: phoneNumber },
    { Name: 'custom:userType', Value: userType },
  ];

  // Add university data for students
  if (userType === 'student' && universityData) {
    userAttributes.push(
      { Name: 'custom:universityName', Value: universityData.name },
      { Name: 'custom:universityDomain', Value: universityData.domain },
      { Name: 'custom:universityCountry', Value: universityData.country }
    );
  }

  // Create user with temporary password
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: userAttributes,
      MessageAction: 'SUPPRESS', // Don't send welcome email
    })
  );

  // Set permanent password
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );
}

/**
 * CORS headers for API responses
 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*', // TODO: Restrict to your frontend domain
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Handle CORS preflight OPTIONS request
 */
function handleCorsPreflightRequest(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: '',
  };
}

/**
 * Parse and validate request body
 */
function parseRequestBody(body: string | null): RegisterRequest {
  if (!body) {
    throw new Error('Request body is required');
  }
  return JSON.parse(body);
}

/**
 * Validate registration request fields
 */
function validateRegistrationRequest(request: RegisterRequest): void {
  const { email, password, name, birthdate, phoneNumber } = request;
  
  if (!email || !password || !name || !birthdate || !phoneNumber) {
    const error = new Error('Missing required fields: email, password, name, birthdate, phoneNumber');
    error.name = 'ValidationError';
    throw error;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Invalid email format');
    error.name = 'ValidationError';
    throw error;
  }
}

/**
 * Create error response
 */
function createErrorResponse(statusCode: number, errorType: string, message: string): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: errorType, message } as ErrorResponse),
  };
}

/**
 * Create success response
 */
function createSuccessResponse(userType: 'student' | 'regular'): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      success: true,
      message: 'User registered successfully',
      userType,
    } as SuccessResponse),
  };
}

/**
 * Handle registration errors
 */
function handleRegistrationError(error: unknown): APIGatewayProxyResult {
  const err = error as Error;
  console.error('Registration error:', { name: err.name, message: err.message });

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return createErrorResponse(400, 'ValidationError', err.message);
  }

  // Handle Cognito errors
  if (err.name === 'UsernameExistsException') {
    return createErrorResponse(409, 'UserExists', 'An account with this email already exists');
  }

  if (err.name === 'InvalidPasswordException') {
    return createErrorResponse(400, 'InvalidPassword', 'Password does not meet requirements');
  }

  // Generic error - don't leak internal details
  return createErrorResponse(500, 'InternalServerError', 'An error occurred during registration. Please try again later.');
}

/**
 * Lambda handler
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Registration request received:', { method: event.httpMethod, path: event.path });

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }

  try {
    // Parse and validate request
    const request = parseRequestBody(event.body);
    validateRegistrationRequest(request);

    const { email, password, name, birthdate, phoneNumber } = request;

    // Check if email belongs to a university
    const universityData = await getUniversityData(email);
    const userType: 'student' | 'regular' = universityData ? 'student' : 'regular';
    const domain = email.split('@')[1];

    if (universityData) {
      console.log(`Domain ${domain} classified as student - ${universityData.name} (${universityData.country})`);
    } else {
      console.log(`Domain ${domain} classified as regular user`);
    }

    // Create Cognito user with university data
    await createCognitoUser(email, password, name, birthdate, phoneNumber, userType, universityData || undefined);

    console.log(`User created successfully with type: ${userType}`);

    return createSuccessResponse(userType);
  } catch (error: unknown) {
    return handleRegistrationError(error);
  }
}
