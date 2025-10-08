/**
 * DynamoDB University Domains Import Script
 * 
 * This script imports university domains from a JSON file into DynamoDB.
 * 
 * Usage:
 *   1. Place your universities.json file in this directory
 *   2. Run: npm install
 *   3. Run: npm run import-domains
 * 
 * JSON Format Expected:
 * [
 *   {
 *     "web_pages": ["http://www.zokei.ac.jp/"],
 *     "name": "Tokyo University of Art and Design",
 *     "alpha_two_code": "JP",
 *     "state-province": null,
 *     "domains": ["zokei.ac.jp"],
 *     "country": "Japan"
 *   }
 * ]
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const REGION = 'eu-central-1';
const TABLE_NAME = 'UniversityDomains';
const BATCH_SIZE = 25; // DynamoDB BatchWrite limit
const AWS_PROFILE = 'mwsoo3a'; // AWS profile to use

// Initialize DynamoDB client
const client = new DynamoDBClient({ 
  region: REGION,
  credentials: process.env.AWS_PROFILE ? undefined : {
    // Will use the profile from AWS_PROFILE env var or credentials file
  }
});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Split array into chunks for batch processing
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Import universities into DynamoDB
 */
async function importUniversities() {
  console.log('🚀 Starting university domains import...\n');

  // Read JSON file
  const jsonPath = join(__dirname, 'universities.json');
  let universities;

  try {
    const rawData = readFileSync(jsonPath, 'utf-8');
    universities = JSON.parse(rawData);
    console.log(`✅ Loaded ${universities.length} universities from ${jsonPath}\n`);
  } catch (error) {
    console.error('❌ Error reading universities.json:', error.message);
    console.error('\nPlease ensure universities.json exists in the scripts/ directory.');
    process.exit(1);
  }

  // Transform data for DynamoDB
  const items = [];
  
  universities.forEach((uni) => {
    // Each university can have multiple domains
    if (uni.domains && Array.isArray(uni.domains)) {
      uni.domains.forEach((domain) => {
        items.push({
          domain: domain,
          name: uni.name,
          country: uni.country,
          'state-province': uni['state-province'],
          alpha_two_code: uni.alpha_two_code,
          web_pages: uni.web_pages || []
        });
      });
    }
  });

  console.log(`📊 Transformed into ${items.length} domain entries\n`);

  // Split into batches
  const batches = chunkArray(items, BATCH_SIZE);
  console.log(`📦 Split into ${batches.length} batches of ${BATCH_SIZE} items\n`);

  // Import batches
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    
    try {
      const params = {
        RequestItems: {
          [TABLE_NAME]: batch.map(item => ({
            PutRequest: {
              Item: item
            }
          }))
        }
      };

      await docClient.send(new BatchWriteCommand(params));
      successCount += batch.length;
      
      // Progress indicator
      const progress = ((i + 1) / batches.length * 100).toFixed(1);
      process.stdout.write(`\r⏳ Progress: ${progress}% (${successCount}/${items.length} items)`);
      
      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      failCount += batch.length;
      console.error(`\n❌ Error importing batch ${i + 1}:`, error.message);
    }
  }

  console.log('\n\n✨ Import completed!');
  console.log(`✅ Success: ${successCount} items`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} items`);
  }
  console.log('\n🎉 Done!\n');
}

// Run the import
importUniversities().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
