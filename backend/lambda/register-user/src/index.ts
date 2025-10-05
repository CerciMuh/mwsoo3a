import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handleCorsPreflightRequest } from './middleware/cors';
import { parseRequestBody, validateRegistrationRequest } from './middleware/validator';
import { handleRegistrationError } from './middleware/error-handler';
import { getUniversityData } from './services/university.service';
import { createCognitoUser } from './services/cognito.service';
import { createSuccessResponse } from './utils/response';

/**
 * Lambda handler for user registration
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Registration request received:', { method: event.httpMethod, path: event.path });

  // Handle preflight OPTIONS request
  const corsResponse = handleCorsPreflightRequest(event);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Parse and validate request
    const request = parseRequestBody(event.body);
    validateRegistrationRequest(request);

    const { email, password, name, birthdate, phoneNumber } = request;

    // Check if email belongs to a university
    const universityData = await getUniversityData(email);
    const userType: 'student' | 'regular' = universityData ? 'student' : 'regular';
    const domain = email.split('@')[1];

    if (universityData) {
      console.log(`Domain ${domain} classified as student - ${universityData.name} (${universityData.country})`);
    } else {
      console.log(`Domain ${domain} classified as regular user`);
    }

    // Create Cognito user with university data
    await createCognitoUser(email, password, name, birthdate, phoneNumber, userType, universityData || undefined);

    console.log(`User created successfully with type: ${userType}`);

    return createSuccessResponse(userType);
  } catch (error: unknown) {
    return handleRegistrationError(error);
  }
}
