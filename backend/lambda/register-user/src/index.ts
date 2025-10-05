import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

// Environment variables
const USER_POOL_ID = process.env.USER_POOL_ID || 'eu-central-1_QEBbXGvw4';
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE || 'UniversityDomains';
const REGION = process.env.AWS_REGION || 'eu-central-1';

// Initialize AWS clients
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
const dynamoClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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
 * Check if domain matches university domain (supports subdomains)
 * Example: student@alumni.harvard.edu matches harvard.edu
 */
function matchesDomain(emailDomain: string, universityDomain: string): boolean {
  // Exact match
  if (emailDomain === universityDomain) {
    return true;
  }
  
  // Subdomain match (e.g., alumni.harvard.edu matches harvard.edu)
  return emailDomain.endsWith('.' + universityDomain);
}

/**
 * Check if email domain belongs to a university
 */
async function isUniversityEmail(email: string): Promise<boolean> {
  const emailDomain = extractDomain(email);
  
  // Try exact match first
  let result = await docClient.send(
    new GetCommand({
      TableName: DYNAMODB_TABLE,
      Key: { domain: emailDomain },
    })
  );
  
  if (result.Item) {
    return true;
  }
  
  // Check if it's a subdomain of any university domain
  // For performance, we'll scan the table (consider adding GSI for production)
  // For now, we'll just check the exact domain
  // To support subdomains properly, you'd need to:
  // 1. Store all subdomains in DynamoDB, OR
  // 2. Extract base domain from email and check against that
  
  // Simple approach: Extract potential base domain
  const parts = emailDomain.split('.');
  if (parts.length > 2) {
    // Try checking base domain (e.g., harvard.edu from alumni.harvard.edu)
    const baseDomain = parts.slice(-2).join('.');
    result = await docClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: { domain: baseDomain },
      })
    );
    
    return !!result.Item;
  }
  
  return false;
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
  userType: 'student' | 'regular'
): Promise<void> {
  // Create user with temporary password
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'false' },
        { Name: 'name', Value: name },
        { Name: 'birthdate', Value: birthdate },
        { Name: 'phone_number', Value: phoneNumber },
        { Name: 'custom:userType', Value: userType },
      ],
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
 * Lambda handler
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Registration request received:', JSON.stringify(event));

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // TODO: Restrict to your frontend domain
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Parse request body
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const body: RegisterRequest = JSON.parse(event.body);

    // Validate required fields
    const { email, password, name, birthdate, phoneNumber } = body;
    if (!email || !password || !name || !birthdate || !phoneNumber) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'ValidationError',
          message: 'Missing required fields: email, password, name, birthdate, phoneNumber',
        } as ErrorResponse),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'ValidationError',
          message: 'Invalid email format',
        } as ErrorResponse),
      };
    }

    // Check if university email
    const isStudent = await isUniversityEmail(email);
    const userType: 'student' | 'regular' = isStudent ? 'student' : 'regular';

    console.log(`Email ${email} classified as: ${userType}`);

    // Create Cognito user
    await createCognitoUser(email, password, name, birthdate, phoneNumber, userType);

    console.log(`User created successfully: ${email} (${userType})`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        userType,
      } as SuccessResponse),
    };
  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle Cognito errors
    if (error.name === 'UsernameExistsException') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'UserExists',
          message: 'An account with this email already exists',
        } as ErrorResponse),
      };
    }

    if (error.name === 'InvalidPasswordException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'InvalidPassword',
          message: 'Password does not meet requirements',
        } as ErrorResponse),
      };
    }

    // Generic error
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'InternalServerError',
        message: error.message || 'An error occurred during registration',
      } as ErrorResponse),
    };
  }
}
