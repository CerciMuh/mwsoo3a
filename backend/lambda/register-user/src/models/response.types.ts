/**
 * Response type definitions
 */

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
  userType: 'student' | 'regular';
}
