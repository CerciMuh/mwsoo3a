# CORS Issue Resolution - October 5, 2025

## Problem

The registration API was failing with CORS errors:
- **Issue**: `Access-Control-Allow-Origin` header missing
- **Root Cause**: API Gateway OPTIONS method was returning 500 Internal Server Error
- **Impact**: Frontend unable to make POST requests to `/auth/register`

## Diagnosis

### Step 1: Frontend Analysis
- ✅ HttpClient configured with `withFetch()` - potentially problematic
- ✅ No HTTP interceptors interfering
- ✅ Request format correct

### Step 2: API Gateway Investigation
```bash
# Testing OPTIONS (preflight) request
curl -X OPTIONS https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/auth/register
# Result: 500 Internal Server Error
```

### Step 3: Root Cause Identification
The OPTIONS method had:
- ✅ MOCK integration configured
- ✅ Method response with CORS headers defined
- ❌ **Missing integration response** - This was the problem!

Without an integration response, the MOCK integration couldn't map the response to include CORS headers.

## Solution

### 1. Fixed Lambda CORS Headers
**File**: `backend/lambda/register-user/src/index.ts`

Changed from:
```typescript
'Access-Control-Allow-Headers': 'Content-Type'
```

To:
```typescript
'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
```

### 2. Added OPTIONS Integration Response
```bash
aws apigateway put-integration-response \
  --rest-api-id abhyzb0eoe \
  --resource-id yhx7op \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters file://cors-integration-response.json \
  --response-templates '{"application/json":""}' \
  --region eu-central-1 \
  --profile mwsoo3a
```

**CORS Headers Configured**:
- `Access-Control-Allow-Origin`: `*`
- `Access-Control-Allow-Methods`: `POST,OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`

### 3. Deployed API Gateway
```bash
aws apigateway create-deployment \
  --rest-api-id abhyzb0eoe \
  --stage-name prod \
  --region eu-central-1 \
  --profile mwsoo3a
```

### 4. Optimized Frontend HttpClient
**File**: `frontend/src/app/app.config.ts`

Removed `withFetch()` for better CORS compatibility:
```typescript
// Before
provideHttpClient(withFetch())

// After
provideHttpClient()
```

## Verification

### OPTIONS Request (Preflight)
```bash
curl -X OPTIONS https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/auth/register
```
✅ **Result**: 200 OK with CORS headers

### POST Request (Actual)
```bash
curl -X POST https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User","birthdate":"1999-01-01","phoneNumber":"+1234567890"}'
```
✅ **Result**: 200 OK with CORS headers and proper response

## Files Changed

1. `backend/lambda/register-user/src/index.ts` - Updated CORS headers
2. `frontend/src/app/app.config.ts` - Removed `withFetch()`
3. API Gateway configuration (via AWS CLI) - Added OPTIONS integration response

## Key Learnings

### API Gateway CORS Setup Requires 3 Parts:

1. **Method Response** - Defines which headers can be returned
   ```json
   {
     "method.response.header.Access-Control-Allow-Origin": true,
     "method.response.header.Access-Control-Allow-Methods": true,
     "method.response.header.Access-Control-Allow-Headers": true
   }
   ```

2. **Integration** - MOCK type for OPTIONS
   ```json
   {
     "type": "MOCK",
     "requestTemplates": {
       "application/json": "{\"statusCode\": 200}"
     }
   }
   ```

3. **Integration Response** ⚠️ **CRITICAL - Often missed!**
   ```json
   {
     "statusCode": "200",
     "responseParameters": {
       "method.response.header.Access-Control-Allow-Origin": "'*'",
       "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'",
       "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
     },
     "responseTemplates": {
       "application/json": ""
     }
   }
   ```

### Lambda Proxy Integration
When using `AWS_PROXY` integration for actual endpoints (POST, GET, etc.):
- The Lambda function **must** return CORS headers in the response
- API Gateway passes through the Lambda response unchanged
- Cannot configure integration responses separately

## Status

✅ **RESOLVED** - CORS is now working correctly for registration endpoint

## Next Steps

- Test registration from the frontend application
- Consider restricting `Access-Control-Allow-Origin` from `*` to specific domain
- Enable API Gateway logging for better debugging in the future
