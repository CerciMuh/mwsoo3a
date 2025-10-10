/**
 * Degree management service
 */

import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/aws-clients';
import { DEGREES_TABLE } from '../config/environment';
import { Degree, CreateDegreeRequest, UpdateDegreeRequest } from '../models/types';
import { slugify, now } from '../utils/helpers';
import { AppError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new degree
 */
export async function createDegree(
  request: CreateDegreeRequest,
  createdBy: string
): Promise<Degree> {
  const degreeSlug = slugify(request.degreeName);
  const degreeId = `deg_${uuidv4()}`;

  // Check if degree already exists for this university
  const existing = await getDegreeBySlug(request.universityDomain, degreeSlug);
  if (existing) {
    throw new AppError(409, `Degree "${request.degreeName}" already exists for this university`);
  }

  // Get university details from UniversityDomains table
  const universityData = await getUniversityData(request.universityDomain);

  const degree: Degree = {
    id: degreeId,
    universityDomain: request.universityDomain,
    universityName: universityData.name,
    universityCountry: universityData.country,
    degreeName: request.degreeName,
    degreeSlug,
    description: request.description,
    degreeType: request.degreeType,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
    courseCount: 0,
    noteCount: 0,
    active: true,
  };

  await docClient.send(
    new PutCommand({
      TableName: DEGREES_TABLE,
      Item: degree,
    })
  );

  return degree;
}

/**
 * Get degree by domain and slug
 */
async function getDegreeBySlug(
  universityDomain: string,
  degreeSlug: string
): Promise<Degree | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: DEGREES_TABLE,
      Key: {
        universityDomain,
        degreeSlug,
      },
    })
  );

  return result.Item as Degree | null;
}

/**
 * Get degree by ID
 */
export async function getDegreeById(degreeId: string): Promise<Degree | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: DEGREES_TABLE,
      IndexName: 'degreeId-index',
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': degreeId,
      },
    })
  );

  return result.Items && result.Items.length > 0 ? (result.Items[0] as Degree) : null;
}

/**
 * List degrees for a university
 */
export async function listDegreesByUniversity(universityDomain: string): Promise<Degree[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: DEGREES_TABLE,
      KeyConditionExpression: 'universityDomain = :domain',
      FilterExpression: 'active = :active',
      ExpressionAttributeValues: {
        ':domain': universityDomain,
        ':active': true,
      },
    })
  );

  return (result.Items || []) as Degree[];
}

/**
 * Update degree
 */
export async function updateDegree(
  degreeId: string,
  updates: UpdateDegreeRequest
): Promise<Degree> {
  const existing = await getDegreeById(degreeId);
  if (!existing) {
    throw new AppError(404, 'Degree not found');
  }

  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  // Build update expression
  if (updates.degreeName !== undefined) {
    updateExpressions.push('#degreeName = :degreeName');
    updateExpressions.push('#degreeSlug = :degreeSlug');
    expressionAttributeNames['#degreeName'] = 'degreeName';
    expressionAttributeNames['#degreeSlug'] = 'degreeSlug';
    expressionAttributeValues[':degreeName'] = updates.degreeName;
    expressionAttributeValues[':degreeSlug'] = slugify(updates.degreeName);
  }

  if (updates.description !== undefined) {
    updateExpressions.push('#description = :description');
    expressionAttributeNames['#description'] = 'description';
    expressionAttributeValues[':description'] = updates.description;
  }

  if (updates.degreeType !== undefined) {
    updateExpressions.push('#degreeType = :degreeType');
    expressionAttributeNames['#degreeType'] = 'degreeType';
    expressionAttributeValues[':degreeType'] = updates.degreeType;
  }

  if (updates.active !== undefined) {
    updateExpressions.push('#active = :active');
    expressionAttributeNames['#active'] = 'active';
    expressionAttributeValues[':active'] = updates.active;
  }

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = now();

  await docClient.send(
    new UpdateCommand({
      TableName: DEGREES_TABLE,
      Key: {
        universityDomain: existing.universityDomain,
        degreeSlug: existing.degreeSlug,
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  // Return updated degree
  return getDegreeById(degreeId) as Promise<Degree>;
}

/**
 * Delete degree (soft delete)
 */
export async function deleteDegree(degreeId: string): Promise<void> {
  const existing = await getDegreeById(degreeId);
  if (!existing) {
    throw new AppError(404, 'Degree not found');
  }

  if (existing.courseCount > 0) {
    throw new AppError(400, 'Cannot delete degree with existing courses');
  }

  await docClient.send(
    new UpdateCommand({
      TableName: DEGREES_TABLE,
      Key: {
        universityDomain: existing.universityDomain,
        degreeSlug: existing.degreeSlug,
      },
      UpdateExpression: 'SET #active = :active, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#active': 'active',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':active': false,
        ':updatedAt': now(),
      },
    })
  );
}

/**
 * Get university data from UniversityDomains table
 */
async function getUniversityData(domain: string): Promise<{ name: string; country: string }> {
  const result = await docClient.send(
    new GetCommand({
      TableName: 'UniversityDomains',
      Key: { domain },
    })
  );

  if (!result.Item) {
    throw new AppError(404, `University not found for domain: ${domain}`);
  }

  return {
    name: result.Item.name as string,
    country: result.Item.country as string,
  };
}
