/**
 * AWS SDK client initialization
 */

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { REGION } from './environment';

export const cognitoClient = new CognitoIdentityProviderClient({ region: REGION });
export const dynamoClient = new DynamoDBClient({ region: REGION });
export const docClient = DynamoDBDocumentClient.from(dynamoClient);
