/**
 * Error handling middleware
 */

import { APIGatewayProxyResult } from 'aws-lambda';
import { createErrorResponse } from '../utils/response';

/**
 * Handle registration errors with proper sanitization
 */
export function handleRegistrationError(error: unknown): APIGatewayProxyResult {
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

  if (err.name === 'InvalidParameterException') {
    return createErrorResponse(400, 'InvalidParameter', 'Invalid registration parameters');
  }

  // Default error
  return createErrorResponse(500, 'InternalError', 'An unexpected error occurred during registration');
}
