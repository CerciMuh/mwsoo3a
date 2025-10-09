/**
 * AWS clients configuration
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// DynamoDB Client
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-central-1' });

export const docClient = DynamoDBDocumentClient.from(dynamoDbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
