# Backend Code Review - Issues & Recommendations

**Date:** October 10, 2025  
**Reviewer:** AI Code Review  
**Scope:** Admin Encyclopedia Lambda, Student Encyclopedia Lambda, Register User Lambda

---

## 🔴 CRITICAL SECURITY ISSUES

### 1. **JWT Token Not Being Verified** ⚠️ **HIGHEST PRIORITY**
**File:** `backend/lambda/admin-encyclopedia/src/middleware/auth.ts`  
**Issue:** The JWT token is decoded but NOT cryptographically verified!

```typescript
// CURRENT (INSECURE):
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
return payload as TokenPayload;
```

**Risk:** Anyone can create a fake JWT token with `"custom:role": "admin"` and gain full admin access!

**Fix Required:**
```typescript
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  tokenUse: "id",
  clientId: process.env.CLIENT_ID!,
});

export async function extractToken(event: APIGatewayProxyEvent): Promise<TokenPayload> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  try {
    // Verify and decode JWT
    const payload = await verifier.verify(token);
    return payload as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

**Dependencies to Install:**
```bash
npm install aws-jwt-verify
```

---

## 🟡 HIGH PRIORITY ISSUES

### 2. **Type Mismatch in degreeType Enum**
**Files:** 
- `backend/lambda/admin-encyclopedia/src/models/types.ts`
- Frontend expects: `'undergraduate' | 'postgraduate' | 'doctorate'`
- Backend has: `'Undergraduate' | 'Graduate' | 'PhD' | 'Certificate'`

**Impact:** Frontend will send 'undergraduate' but backend expects 'Undergraduate'

**Fix:** Standardize on lowercase:
```typescript
export type DegreeType = 'undergraduate' | 'postgraduate' | 'doctorate' | 'certificate';

export interface Degree {
  // ...
  degreeType: DegreeType;
}
```

### 3. **Missing Input Validation**
**Files:** All service files  
**Issue:** No validation for:
- String length limits (degree name, course name, description)
- Invalid characters in inputs
- SQL injection patterns (though using DynamoDB)
- XSS attempts in text fields

**Fix Required:** Add validation layer:
```typescript
export function validateCreateDegreeRequest(request: CreateDegreeRequest): void {
  if (!request.degreeName || request.degreeName.trim().length === 0) {
    throw new AppError(400, 'Degree name is required');
  }

  if (request.degreeName.length > 200) {
    throw new AppError(400, 'Degree name must be less than 200 characters');
  }

  if (request.description && request.description.length > 2000) {
    throw new AppError(400, 'Description must be less than 2000 characters');
  }

  const validTypes = ['undergraduate', 'postgraduate', 'doctorate', 'certificate'];
  if (request.degreeType && !validTypes.includes(request.degreeType.toLowerCase())) {
    throw new AppError(400, `Invalid degree type. Must be one of: ${validTypes.join(', ')}`);
  }
}
```

### 4. **Missing Authorization Checks**
**Files:** All service files  
**Issue:** Admin can modify ANY university's degrees/courses without domain check

**Current Flow:**
1. Admin authenticates ✅
2. Admin can create degree for ANY university ❌
3. No check if admin belongs to that university ❌

**Fix Required:**
```typescript
export async function createDegree(
  request: CreateDegreeRequest,
  createdBy: string,
  adminUniversityDomain: string  // Add this parameter
): Promise<Degree> {
  // Verify admin belongs to the university they're modifying
  if (request.universityDomain !== adminUniversityDomain) {
    throw new AppError(403, 'You can only manage degrees for your own university');
  }

  // ... rest of code
}
```

### 5. **No Request Size Limits**
**Files:** `index.ts` handlers  
**Issue:** No limits on body size, could be exploited for DoS

**Fix:** Add API Gateway configuration:
```yaml
# In API Gateway settings
RequestBodyValidation: true
MaximumBodySize: 1048576  # 1MB
```

### 6. **Incomplete Error Messages Leak Implementation Details**
**File:** `utils/errors.ts`  
**Issue:**
```typescript
return createCorsResponse(500, {
  success: false,
  message: error.message,  // Could leak stack traces or DB errors
});
```

**Fix:**
```typescript
return createCorsResponse(500, {
  success: false,
  message: process.env.NODE_ENV === 'development' 
    ? error.message 
    : 'An unexpected error occurred',
});
```

---

## 🟢 MEDIUM PRIORITY ISSUES

### 7. **TODO Comments Not Addressed**
**File:** `course.service.ts:67`
```typescript
// TODO: Increment courseCount in UniversityDegrees table
// This will be done in a future update
```

**Impact:** courseCount will always be 0, affecting UI displays

**Fix:** Add DynamoDB update:
```typescript
await docClient.send(
  new UpdateCommand({
    TableName: DEGREES_TABLE,
    Key: {
      universityDomain: degree.universityDomain,
      degreeSlug: degree.degreeSlug,
    },
    UpdateExpression: 'ADD courseCount :inc',
    ExpressionAttributeValues: {
      ':inc': 1,
    },
  })
);
```

### 8. **No Pagination for List Operations**
**Files:** `degree.service.ts`, `course.service.ts`  
**Issue:** `listDegreesByUniversity` and `listCoursesByDegree` return ALL items

**Impact:** Performance issues with large datasets

**Fix:** Add pagination:
```typescript
export async function listDegreesByUniversity(
  universityDomain: string,
  limit: number = 50,
  lastEvaluatedKey?: Record<string, any>
): Promise<{ degrees: Degree[], nextToken?: string }> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: DEGREES_TABLE,
      KeyConditionExpression: 'universityDomain = :domain',
      ExpressionAttributeValues: {
        ':domain': universityDomain,
      },
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    degrees: (result.Items || []) as Degree[],
    nextToken: result.LastEvaluatedKey 
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined,
  };
}
```

### 9. **Inconsistent Timestamp Handling**
**File:** `utils/helpers.ts`  
**Issue:** Using ISO strings instead of Unix timestamps

**Recommendation:** DynamoDB performs better with Unix timestamps:
```typescript
export function now(): number {
  return Math.floor(Date.now() / 1000);
}
```

### 10. **Missing Unique Constraint Validation**
**File:** `course.service.ts`  
**Issue:** courseCode should be unique per university, but only checked against degree

**Fix:** Add university-level check using the GSI:
```typescript
const existingByCode = await getCourseByCode(degree.universityDomain, request.courseCode);
if (existingByCode) {
  throw new AppError(409, `Course code "${request.courseCode}" already exists at this university`);
}
```

### 11. **No Soft Delete Verification**
**Files:** All service files  
**Issue:** Deleted (active=false) items still appear in queries

**Fix:** Add filter:
```typescript
const result = await docClient.send(
  new QueryCommand({
    TableName: DEGREES_TABLE,
    KeyConditionExpression: 'universityDomain = :domain',
    FilterExpression: 'active = :active',  // Add this
    ExpressionAttributeValues: {
      ':domain': universityDomain,
      ':active': true,  // Add this
    },
  })
);
```

### 12. **No Rate Limiting**
**Issue:** No protection against abuse or DoS attacks

**Fix:** Add AWS WAF rate limiting or API Gateway throttling:
```yaml
# API Gateway stage settings
ThrottleSettings:
  BurstLimit: 100
  RateLimit: 50
```

---

## 🔵 LOW PRIORITY / BEST PRACTICES

### 13. **Console.log Should Use Structured Logging**
**Issue:** Console.logs are not searchable in CloudWatch

**Fix:** Use structured logging:
```typescript
console.log(JSON.stringify({
  level: 'INFO',
  event: 'degree_created',
  userId: createdBy,
  degreeId: degreeId,
  timestamp: new Date().toISOString(),
}));
```

### 14. **No Health Check Endpoint**
**Issue:** Can't monitor Lambda health

**Fix:** Add health endpoint:
```typescript
if (path === '/health') {
  return createCorsResponse(200, { status: 'healthy' });
}
```

### 15. **Environment Variables Not Validated**
**File:** `config/environment.ts`  
**Issue:** Missing validation for required env vars

**Fix:**
```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const DEGREES_TABLE = requireEnv('DEGREES_TABLE');
export const COURSES_TABLE = requireEnv('COURSES_TABLE');
```

### 16. **No CORS Origin Validation**
**File:** `middleware/cors.ts`  
**Issue:** Allows all origins with wildcard

**Fix:** Validate against whitelist:
```typescript
const ALLOWED_ORIGINS = [
  'https://your-app.vercel.app',
  'http://localhost:4200',
];

export function createCorsResponse(statusCode: number, body: any, origin?: string): APIGatewayProxyResult {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      // ...
    },
    body: JSON.stringify(body),
  };
}
```

---

## 📊 Summary

| Severity | Count | Must Fix |
|----------|-------|----------|
| 🔴 Critical | 1 | ✅ YES |
| 🟡 High | 6 | ✅ YES |
| 🟢 Medium | 6 | ⚠️ Recommended |
| 🔵 Low | 6 | 💡 Nice to have |

**Total Issues Found:** 19

---

## 🚀 Recommended Action Plan

### Phase 1 (Immediate - Security)
1. ✅ Implement JWT verification using `aws-jwt-verify`
2. ✅ Fix degreeType enum mismatch
3. ✅ Add university domain authorization checks
4. ✅ Add input validation layer

### Phase 2 (Short Term - Functionality)
5. ⚠️ Implement courseCount increment
6. ⚠️ Add soft delete filtering
7. ⚠️ Add course code uniqueness check
8. ⚠️ Fix error message leakage

### Phase 3 (Medium Term - Performance)
9. 💡 Add pagination
10. 💡 Add rate limiting
11. 💡 Optimize timestamp handling

### Phase 4 (Long Term - Monitoring)
12. 💡 Add structured logging
13. 💡 Add health check
14. 💡 Validate environment variables
15. 💡 Restrict CORS origins

---

## ✅ What's Good

- Well-organized service layer separation
- Proper use of DynamoDB SDK
- Good error handling structure
- CORS properly configured
- Consistent naming conventions
- TypeScript types well defined
- Code is readable and maintainable
