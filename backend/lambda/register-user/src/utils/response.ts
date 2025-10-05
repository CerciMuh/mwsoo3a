/**
 * Response utilities
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { CORS_HEADERS } from '../middleware/cors';
import { ErrorResponse, SuccessResponse } from '../models/response.types';

/**
 * Create error response
 */
export function createErrorResponse(statusCode: number, errorType: string, message: string): APIGatewayProxyResult {
  const errorResponse: ErrorResponse = {
    error: errorType,
    message,
  };

  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(errorResponse),
  };
}

/**
 * Create success response
 */
export function createSuccessResponse(userType: 'student' | 'regular'): APIGatewayProxyResult {
  const successResponse: SuccessResponse = {
    success: true,
    message: 'User registered successfully',
    userType,
  };

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(successResponse),
  };
}
