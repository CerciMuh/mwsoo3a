/**
 * Error handling utilities
 */

import { createCorsResponse } from '../middleware/cors';
import { APIGatewayProxyResult } from 'aws-lambda';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): APIGatewayProxyResult {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return createCorsResponse(error.statusCode, {
      success: false,
      message: error.message,
    });
  }

  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('Admin access required')) {
      return createCorsResponse(403, {
        success: false,
        message: 'Admin access required',
      });
    }

    if (error.message.includes('Missing Authorization')) {
      return createCorsResponse(401, {
        success: false,
        message: 'Unauthorized - Missing token',
      });
    }

    if (error.message.includes('Invalid token')) {
      return createCorsResponse(401, {
        success: false,
        message: 'Unauthorized - Invalid token',
      });
    }

    return createCorsResponse(500, {
      success: false,
      message: error.message,
    });
  }

  return createCorsResponse(500, {
    success: false,
    message: 'An unexpected error occurred',
  });
}
