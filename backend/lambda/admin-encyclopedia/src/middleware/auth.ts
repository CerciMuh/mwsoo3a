/**
 * Admin authorization middleware
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthUser, TokenPayload } from '../models/types';
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
export async function extractToken(event: APIGatewayProxyEvent): Promise<TokenPayload> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
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
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify user has admin role
 */
export async function requireAdmin(event: APIGatewayProxyEvent): Promise<AuthUser> {
  const token = await extractToken(event);
  
  if (token['custom:role'] !== 'admin') {
    throw new Error('Admin access required');
  }

  return {
    userId: token.sub,
    email: token.email,
    role: token['custom:role'],
    userType: token['custom:userType'],
    universityDomain: token['custom:universityDomain'],
  };
}
