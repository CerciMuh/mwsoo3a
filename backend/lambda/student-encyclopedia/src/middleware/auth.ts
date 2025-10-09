/**
 * Student authentication middleware
 * Extracts and validates JWT token, ensures user is a student with universityDomain
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import jwt from 'jsonwebtoken';
import { TokenPayload, AuthStudent } from '../models/types';
import { AppError } from '../utils/errors';
import { JWT_ISSUER } from '../config/environment';

/**
 * Extract and validate student authentication
 * Requires custom:universityDomain in JWT
 */
export function requireStudent(event: APIGatewayProxyEvent): AuthStudent {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    throw new AppError(401, 'Missing Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Decode without verification (Cognito already validated it at API Gateway)
    const decoded = jwt.decode(token) as TokenPayload;

    if (!decoded) {
      throw new AppError(401, 'Invalid token');
    }

    // Verify issuer if configured
    if (JWT_ISSUER && decoded.iss !== JWT_ISSUER) {
      throw new AppError(401, 'Invalid token issuer');
    }

    // Ensure student has university domain
    if (!decoded['custom:universityDomain']) {
      throw new AppError(403, 'Access denied: No university affiliation');
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      userType: decoded['custom:userType'],
      universityDomain: decoded['custom:universityDomain'],
      universityName: decoded['custom:universityName'],
      universityCountry: decoded['custom:universityCountry'],
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(401, 'Invalid authentication token');
  }
}
