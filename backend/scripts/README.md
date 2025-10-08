# Scripts

Utility scripts for backend operations.

## Import University Domains

### Prerequisites

1. **AWS Credentials**: Ensure AWS CLI is configured with credentials that have DynamoDB write permissions.

2. **DynamoDB Table**: The `UniversityDomains` table must exist. Create it using:

```bash
aws dynamodb create-table \
  --table-name UniversityDomains \
  --attribute-definitions AttributeName=domain,AttributeType=S \
  --key-schema AttributeName=domain,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1
```

3. **Universities JSON File**: Place your `universities.json` file in this directory.

### Usage

```bash
# Install dependencies
npm install

# Run import script
npm run import-domains
```

### JSON Format

The script expects a JSON array with the following structure:

```json
[
  {
    "web_pages": ["http://www.example.edu/"],
    "name": "Example University",
    "alpha_two_code": "US",
    "state-province": "California",
    "domains": ["example.edu", "alumni.example.edu"],
    "country": "United States"
  }
]
```

**Note**: Each university can have multiple domains. The script will create a separate DynamoDB item for each domain.

### Example

See `universities.example.json` for a sample file with 3 universities.

### Import Process

1. Reads `universities.json` from the scripts directory
2. Transforms each domain into a DynamoDB item
3. Batches items into groups of 25 (DynamoDB limit)
4. Imports batches with progress indicator
5. Reports success/failure counts

### Troubleshooting

**Error: Cannot find module 'universities.json'**
- Ensure your JSON file is named exactly `universities.json` and is in the scripts/ directory

**Error: AccessDeniedException**
- Check your AWS credentials have `dynamodb:PutItem` and `dynamodb:BatchWriteItem` permissions

**Error: ResourceNotFoundException**
- The DynamoDB table doesn't exist. Create it using the command above.
