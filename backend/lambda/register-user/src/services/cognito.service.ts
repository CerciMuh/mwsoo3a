/**
 * Cognito user management service
 */

import { AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient } from '../config/aws-clients';
import { USER_POOL_ID } from '../config/environment';
import { UniversityData } from '../models/university.types';

/**
 * Create user in Cognito with custom attributes
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
    { Name: 'email_verified', Value: 'false' },
    { Name: 'name', Value: name },
    { Name: 'birthdate', Value: birthdate },
    { Name: 'phone_number', Value: phoneNumber },
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

  // Create user with temporary password
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: userAttributes,
      MessageAction: 'SUPPRESS', // Don't send welcome email
    })
  );

  // Set permanent password
  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );
}
