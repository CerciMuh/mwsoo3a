/**
 * Request validation middleware
 */

import { RegisterRequest } from '../models/request.types';

/**
 * Parse and validate request body
 */
export function parseRequestBody(body: string | null): RegisterRequest {
  if (!body) {
    throw new Error('Request body is required');
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(body);
  } catch (error) {
    throw new Error('Invalid JSON format in request body');
  }

  return parsedBody as RegisterRequest;
}

/**
 * Validate registration request fields
 */
export function validateRegistrationRequest(data: RegisterRequest): void {
  const { email, password, name, birthdate, phoneNumber } = data;

  if (!email || !password || !name || !birthdate || !phoneNumber) {
    const error = new Error('Missing required fields: email, password, name, birthdate, phoneNumber');
    error.name = 'ValidationError';
    throw error;
  }

  if (typeof email !== 'string' || typeof password !== 'string' || 
      typeof name !== 'string' || typeof birthdate !== 'string' || 
      typeof phoneNumber !== 'string') {
    const error = new Error('Invalid field types');
    error.name = 'ValidationError';
    throw error;
  }

  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters long');
    error.name = 'ValidationError';
    throw error;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Invalid email format');
    error.name = 'ValidationError';
    throw error;
  }
}
