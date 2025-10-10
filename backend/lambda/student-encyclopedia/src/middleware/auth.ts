/**
 * Student authentication middleware
 * Extracts and validates JWT token, ensures user is a student with universityDomain
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { TokenPayload, AuthStudent } from '../models/types';
import { AppError } from '../utils/errors';
import { USER_POOL_ID, CLIENT_ID } from '../config/environment';

// Create JWT verifier instance
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: "id",
  clientId: CLIENT_ID,
});

/**
 * Extract and verify JWT token from Authorization header
 */
async function extractToken(event: APIGatewayProxyEvent): Promise<TokenPayload> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new AppError(401, 'Missing Authorization header');
  }

  // Extract token (remove "Bearer " prefix if present)
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    // Verify and decode JWT token
    const payload = await verifier.verify(token);
    return payload as unknown as TokenPayload;
  } catch (error) {
    throw new AppError(401, 'Invalid or expired token');
  }
}

/**
 * Extract and validate student authentication
 * Requires custom:universityDomain in JWT
 */
export async function requireStudent(event: APIGatewayProxyEvent): Promise<AuthStudent> {
  const token = await extractToken(event);

  // Ensure student has university domain
  if (!token['custom:universityDomain']) {
    throw new AppError(403, 'Access denied: No university affiliation');
  }

  return {
    userId: token.sub,
    email: token.email,
    userType: token['custom:userType'],
    universityDomain: token['custom:universityDomain'],
    universityName: token['custom:universityName'],
    universityCountry: token['custom:universityCountry'],
  };
}
