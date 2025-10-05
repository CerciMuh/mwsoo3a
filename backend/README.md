# Backend

Serverless backend for MWsoo3a application.

## Architecture

- **API Gateway**: REST API for frontend-backend communication
- **Lambda Functions**: Serverless compute for business logic
- **DynamoDB**: University domains database
- **Cognito**: User authentication and authorization

## Structure

```
backend/
├── lambda/           # Lambda function handlers
│   └── register-user/
├── scripts/          # Utility scripts (DynamoDB import, etc.)
└── README.md
```

## AWS Services

- **Region**: `eu-central-1`
- **Cognito User Pool**: `eu-central-1_QEBbXGvw4`
- **DynamoDB Table**: `UniversityDomains`
- **API Gateway**: To be created

## Setup Instructions

### 1. Configure AWS Credentials

Ensure AWS CLI is configured with appropriate credentials:

```bash
aws configure
```

### 2. Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name UniversityDomains \
  --attribute-definitions AttributeName=domain,AttributeType=S \
  --key-schema AttributeName=domain,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1
```

### 3. Import University Domains

```bash
cd scripts
npm install
node import-domains.js
```

### 4. Deploy Lambda Functions

See individual Lambda function README files for deployment instructions.

## Development

### Prerequisites

- Node.js 20.x or later
- AWS CLI configured
- AWS SAM CLI (optional, for local testing)

### Environment Variables

Lambda functions require the following environment variables:

- `COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `COGNITO_CLIENT_ID`: Cognito App Client ID
- `DYNAMODB_TABLE_NAME`: DynamoDB table name
