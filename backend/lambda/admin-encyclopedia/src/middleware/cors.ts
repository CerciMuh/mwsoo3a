/**
 * CORS middleware
 */

import { APIGatewayProxyResult } from 'aws-lambda';

const ALLOWED_ORIGINS = [
  'http://localhost:4200',
  'http://localhost:3000',
  // Add production origins here
];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // TODO: Restrict in production
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function createCorsResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

export function createOptionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: '',
  };
}
