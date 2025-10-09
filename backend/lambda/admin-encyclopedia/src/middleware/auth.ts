/**
 * Admin authorization middleware
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { AuthUser, TokenPayload } from '../models/types';

/**
 * Extract and decode JWT token from Authorization header
 */
export function extractToken(event: APIGatewayProxyEvent): TokenPayload {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  // Extract token (remove "Bearer " prefix if present)
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    // Decode JWT payload (base64 decode the middle part)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload as TokenPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Verify user has admin role
 */
export function requireAdmin(event: APIGatewayProxyEvent): AuthUser {
  const token = extractToken(event);
  
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
