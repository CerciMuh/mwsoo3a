# Register User Lambda Function

Lambda function that handles user registration with automatic university domain verification.

## Features

- ✅ Validates user input (email, password, name, birthdate, phone)
- ✅ Checks if email belongs to a university (via DynamoDB lookup)
- ✅ Supports subdomain matching (e.g., `student@alumni.harvard.edu` matches `harvard.edu`)
- ✅ Creates Cognito user with `custom:userType` attribute
- ✅ Sets user type as `student` or `regular` based on email domain
- ✅ CORS enabled for frontend integration
- ✅ Comprehensive error handling

## Environment Variables

The Lambda function requires these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `USER_POOL_ID` | Cognito User Pool ID | `eu-central-1_QEBbXGvw4` |
| `DYNAMODB_TABLE` | DynamoDB table name | `UniversityDomains` |
| `AWS_REGION` | AWS Region | `eu-central-1` |

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Package for Deployment

```bash
npm run package
```

This creates `lambda.zip` ready for upload to AWS.

## Deployment

### Option 1: AWS Console

1. Go to AWS Lambda → Create function
2. Function name: `RegisterUser`
3. Runtime: Node.js 20.x
4. Upload `lambda.zip`
5. Set handler: `index.handler`
6. Add environment variables (if different from defaults)
7. Attach IAM role with permissions (see below)

### Option 2: AWS CLI

**First deployment (create function):**

```bash
aws lambda create-function \
  --function-name RegisterUser \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/LambdaExecutionRole \
  --handler index.handler \
  --zip-file fileb://lambda.zip \
  --timeout 30 \
  --memory-size 256 \
  --region eu-central-1 \
  --profile mwsoo3a
```

**Update existing function:**

```bash
npm run deploy
```

## IAM Permissions Required

The Lambda execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminSetUserPassword"
      ],
      "Resource": "arn:aws:cognito-idp:eu-central-1:*:userpool/eu-central-1_QEBbXGvw4"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:eu-central-1:*:table/UniversityDomains"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## API Request Format

**Endpoint:** `POST /auth/register`

**Request Body:**

```json
{
  "email": "student@harvard.edu",
  "password": "SecurePass123!",
  "name": "John Doe",
  "birthdate": "1999-01-01",
  "phoneNumber": "+1234567890"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "userType": "student"
}
```

**Error Response (400/409/500):**

```json
{
  "error": "UserExists",
  "message": "An account with this email already exists"
}
```

## Testing Locally

You can test the Lambda function locally using AWS SAM:

```bash
# Install SAM CLI first
sam local invoke RegisterUser -e test-event.json
```

## Domain Matching Logic

The function supports subdomain matching:

- `student@harvard.edu` → checks for `harvard.edu` → ✅ Student
- `john@alumni.harvard.edu` → checks `alumni.harvard.edu`, then falls back to `harvard.edu` → ✅ Student
- `user@gmail.com` → checks for `gmail.com` → ❌ Regular user

## Troubleshooting

**Error: "User pool does not exist"**
- Check `USER_POOL_ID` environment variable
- Verify Lambda execution role has Cognito permissions

**Error: "Table not found"**
- Check `DYNAMODB_TABLE` environment variable
- Ensure DynamoDB table exists in the same region
- Verify Lambda execution role has DynamoDB read permissions

**Error: "UsernameExistsException"**
- User with this email already exists in Cognito
- User should use login or password reset flow
