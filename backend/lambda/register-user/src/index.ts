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
 * Check if email domain belongs to a university
 * Uses parallel queries and caching for optimal performance
 */
async function isUniversityEmail(email: string): Promise<boolean> {
  const emailDomain = extractDomain(email);
  
  // Check cache first
  const cached = domainCache.get(emailDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    cacheHits++;
    console.log(`Cache hit for domain: ${emailDomain} (hits: ${cacheHits}, misses: ${cacheMisses})`);
    return cached.isUniversity;
  }
  
  cacheMisses++;
  
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
  
  // Remove duplicates (e.g., exact match might equal one of the variations)
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
      found: !!result.Item,
    }))
  );
  
  const results = await Promise.all(queryPromises);
  
  // Check if any query found a match
  const isUniversity = results.some(r => r.found);
  
  // Cache the result
  domainCache.set(emailDomain, {
    isUniversity,
    timestamp: Date.now(),
  });
  
  // Clean old cache entries (simple LRU: keep only last 1000 entries)
  if (domainCache.size > 1000) {
    const entriesToDelete = domainCache.size - 1000;
    let deleted = 0;
    for (const key of domainCache.keys()) {
      domainCache.delete(key);
      deleted++;
      if (deleted >= entriesToDelete) break;
    }
    console.log(`Cache cleanup: removed ${deleted} old entries`);
  }
  
  if (isUniversity) {
    const matchedDomain = results.find(r => r.found)?.domain;
    console.log(`University domain found: ${matchedDomain} matches ${emailDomain}`);
  }
  
  return isUniversity;
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
  console.log('Registration request received:', { method: event.httpMethod, path: event.path });

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // TODO: Restrict to your frontend domain
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
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
    const domain = email.split('@')[1];

    console.log(`Domain ${domain} classified as: ${userType}`);

    // Create Cognito user
    await createCognitoUser(email, password, name, birthdate, phoneNumber, userType);

    console.log(`User created successfully with type: ${userType}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'User registered successfully',
        userType,
      } as SuccessResponse),
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Registration error:', { name: err.name, message: err.message });

    // Handle Cognito errors
    if (err.name === 'UsernameExistsException') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'UserExists',
          message: 'An account with this email already exists',
        } as ErrorResponse),
      };
    }

    if (err.name === 'InvalidPasswordException') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'InvalidPassword',
          message: 'Password does not meet requirements',
        } as ErrorResponse),
      };
    }

    // Generic error - don't leak internal details
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'An error occurred during registration. Please try again later.',
      } as ErrorResponse),
    };
  }
}
