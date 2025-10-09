/**
 * Error handling utilities
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { createCorsResponse } from '../middleware/cors';

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

  return createCorsResponse(500, {
    success: false,
    message: 'Internal server error',
  });
}
