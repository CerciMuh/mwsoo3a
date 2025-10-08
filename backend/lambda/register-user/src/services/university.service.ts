/**
 * University domain verification service
 */

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/aws-clients';
import { DYNAMODB_TABLE } from '../config/environment';
import { UniversityData } from '../models/university.types';

/**
 * Extract domain from email address
 */
export function extractDomain(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) {
    throw new Error('Invalid email format');
  }
  return parts[1].toLowerCase();
}

/**
 * Check if email domain belongs to a university and return university data
 * Uses parallel queries for optimal performance
 */
export async function getUniversityData(email: string): Promise<UniversityData | null> {
  const emailDomain = extractDomain(email);
  
  // Build all possible domain variations to check
  const parts = emailDomain.split('.');
  const domainsToCheck: string[] = [emailDomain]; // Always check exact match
  
  if (parts.length > 2) {
    // Add last 3 parts (e.g., manchester.ac.uk from student.manchester.ac.uk)
    if (parts.length >= 3) {
      domainsToCheck.push(parts.slice(-3).join('.'));
    }
    
    // Add last 2 parts (e.g., stanford.edu from alumni.stanford.edu)
    domainsToCheck.push(parts.slice(-2).join('.'));
    
    // Add last 4 parts for very long subdomains
    if (parts.length >= 4) {
      domainsToCheck.push(parts.slice(-4).join('.'));
    }
  }
  
  // Remove duplicates
  const uniqueDomains = [...new Set(domainsToCheck)];
  
  console.log(`Checking ${uniqueDomains.length} domain variations for: ${emailDomain}`);
  
  // Execute all queries in parallel
  const queryPromises = uniqueDomains.map(domain =>
    docClient.send(
      new GetCommand({
        TableName: DYNAMODB_TABLE,
        Key: { domain },
      })
    ).then(result => ({
      domain,
      data: result.Item as UniversityData | undefined,
    }))
  );
  
  const results = await Promise.all(queryPromises);
  
  // Find first match with data
  const match = results.find(r => r.data);
  
  if (match?.data) {
    console.log(`University found: ${match.data.name} (${match.data.country})`);
    return match.data;
  }
  
  console.log(`No university found for domain: ${emailDomain}`);
  return null;
}
