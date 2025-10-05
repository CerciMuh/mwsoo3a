# API Gateway Setup Guide

## API Information

- **API ID:** `abhyzb0eoe`
- **API Name:** MWsoo3a API
- **Root Resource ID:** `4xqpu9q5cg`
- **Region:** eu-central-1

## Manual Setup Steps (AWS Console - Recommended)

### 1. Open API Gateway Console

Go to: https://eu-central-1.console.aws.amazon.com/apigateway/main/apis

### 2. Select "MWsoo3a API"

### 3. Create Resources

- Click **Resources** → **Create Resource**
- Resource name: `auth`
- Click **Create Resource**

### 4. Create Method

- Select the `/auth` resource
- Click **Create Method**
- Method type: `POST`
- Integration type: `Lambda Function`
- Lambda function: `RegisterUser`
- Click **Create Method**

### 5. Enable CORS

- Select the `/auth` resource
- Click **Enable CORS**
- Check all methods
- Click **Save**

### 6. Deploy API

- Click **Deploy API**
- Stage: **New Stage**
- Stage name: `prod`
- Click **Deploy**

### 7. Get API URL

After deployment, you'll see the **Invoke URL**. It will look like:

```
https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod
```

Your registration endpoint will be:

```
https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/auth/register
```

### 8. Update Frontend

Update `frontend/src/environments/environment.ts`:

```typescript
apiUrl: 'https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod',
```

## CLI Setup (Alternative - Complex)

If you prefer CLI, run these commands:

```bash
# Set variables
API_ID=abhyzb0eoe
ROOT_RESOURCE_ID=4xqpu9q5cg
LAMBDA_ARN=arn:aws:lambda:eu-central-1:YOUR_ACCOUNT_ID:function:RegisterUser
REGION=eu-central-1
ACCOUNT_ID=YOUR_ACCOUNT_ID

# Create /auth resource
AUTH_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part auth \
  --region $REGION \
  --profile mwsoo3a \
  --query 'id' \
  --output text)

echo "Auth Resource ID: $AUTH_RESOURCE"

# Create /auth/register resource
REGISTER_RESOURCE=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $AUTH_RESOURCE \
  --path-part register \
  --region $REGION \
  --profile mwsoo3a \
  --query 'id' \
  --output text)

echo "Register Resource ID: $REGISTER_RESOURCE"

# Create POST method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $REGISTER_RESOURCE \
  --http-method POST \
  --authorization-type NONE \
  --region $REGION \
  --profile mwsoo3a

# Set Lambda integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $REGISTER_RESOURCE \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
  --region $REGION \
  --profile mwsoo3a

# Grant API Gateway permission to invoke Lambda
aws lambda add-permission \
  --function-name RegisterUser \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/*/*/auth/register" \
  --region $REGION \
  --profile mwsoo3a

# Enable CORS (OPTIONS method)
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $REGISTER_RESOURCE \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION \
  --profile mwsoo3a

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION \
  --profile mwsoo3a

echo "API deployed!"
echo "Endpoint: https://$API_ID.execute-api.$REGION.amazonaws.com/prod/auth/register"
```

## Testing

Test with curl:

```bash
curl -X POST https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@harvard.edu",
    "password": "SecurePass123!",
    "name": "John Doe",
    "birthdate": "1999-01-01",
    "phoneNumber": "+1234567890"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "User registered successfully",
  "userType": "student"
}
```
