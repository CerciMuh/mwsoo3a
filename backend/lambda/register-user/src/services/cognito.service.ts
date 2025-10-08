/**
 * Cognito user management service
 */

import { SignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '../config/aws-clients';
import { USER_POOL_ID } from '../config/environment';
import { UniversityData } from '../models/university.types';

// Get Client ID from environment
const CLIENT_ID = process.env.CLIENT_ID;
if (!CLIENT_ID) {
  throw new Error('Missing required environment variable: CLIENT_ID');
}

/**
 * Create user in Cognito with custom attributes
 * Uses SignUp (not AdminCreateUser) to avoid temporary passwords
 */
export async function createCognitoUser(
  email: string,
  password: string,
  name: string,
  birthdate: string,
  phoneNumber: string,
  userType: 'student' | 'regular',
  universityData?: UniversityData
): Promise<void> {
  const userAttributes = [
    { Name: 'email', Value: email },
    { Name: 'name', Value: name },
    { Name: 'birthdate', Value: birthdate },
    { Name: 'phone_number', Value: phoneNumber },
    { Name: 'updated_at', Value: Math.floor(Date.now() / 1000).toString() },
    { Name: 'custom:userType', Value: userType },
  ];

  // Add university data for students
  if (userType === 'student' && universityData) {
    userAttributes.push(
      { Name: 'custom:universityName', Value: universityData.name },
      { Name: 'custom:universityDomain', Value: universityData.domain },
      { Name: 'custom:universityCountry', Value: universityData.country }
    );
  }

  // Use SignUp command - creates user with their password and sends verification code only
  await cognitoClient.send(
    new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: userAttributes,
    })
  );
}
