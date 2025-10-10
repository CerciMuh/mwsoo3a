# Security Fixes Applied - Admin Encyclopedia Lambda

**Date:** October 10, 2025  
**Lambda:** Admin Encyclopedia  
**Status:** ✅ Critical fixes applied, build successful

---

## ✅ COMPLETED FIXES

### 1. 🔴 JWT Verification (CRITICAL)
**Status:** ✅ FIXED  
**Priority:** Highest

**Changes Made:**
- ✅ Installed `aws-jwt-verify@4.0.1` package
- ✅ Updated `config/environment.ts` to include `USER_POOL_ID` and `CLIENT_ID`
- ✅ Completely rewrote `middleware/auth.ts`:
  - Replaced Base64 decode with `CognitoJwtVerifier.verify()`
  - Tokens are now cryptographically verified
  - Expired tokens are rejected
  - Tampered tokens are rejected
- ✅ Updated `index.ts` to handle async auth (added `await`)

**Security Impact:**
- **BEFORE:** Anyone could create a fake JWT and claim to be admin
- **AFTER:** Only valid tokens signed by AWS Cognito are accepted

**Code Example:**
```typescript
// BEFORE (INSECURE):
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

// AFTER (SECURE):
const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: "id",
  clientId: CLIENT_ID,
});
const payload = await verifier.verify(token);
```

---

### 2. 🟡 DegreeType Enum Mismatch
**Status:** ✅ FIXED  
**Priority:** High

**Changes Made:**
- ✅ Created `DegreeType` type alias in `models/types.ts`
- ✅ Changed values from capitalized to lowercase:
  - `'Undergraduate'` → `'undergraduate'`
  - `'Graduate'` → `'postgraduate'`
  - `'PhD'` → `'doctorate'`
  - `'Certificate'` → `'certificate'`
- ✅ Updated all interfaces to use the new type

**Impact:**
- **BEFORE:** Frontend sent 'undergraduate', backend expected 'Undergraduate' → validation failure
- **AFTER:** Perfect alignment between frontend and backend

---

### 3. 🟡 Input Validation
**Status:** ✅ FIXED  
**Priority:** High

**Changes Made:**
- ✅ Created `utils/validation.ts` with comprehensive validation
- ✅ Added validators for:
  - `validateCreateDegreeRequest()`
  - `validateUpdateDegreeRequest()`
  - `validateCreateCourseRequest()`
  - `validateUpdateCourseRequest()`
- ✅ Added validation calls to all POST/PUT handlers in `index.ts`

**Validations Added:**
- ✅ String length limits (degree name: 200 chars, description: 2000 chars)
- ✅ Required field checks with type validation
- ✅ Enum value validation (degreeType, semester)
- ✅ Numeric range validation (credits: 0-100, year: 1-10)
- ✅ Empty string detection (trim + length check)

**Example:**
```typescript
// Validates degree name
if (!request.degreeName || request.degreeName.trim().length === 0) {
  throw new AppError(400, 'Degree name is required');
}
if (request.degreeName.length > 200) {
  throw new AppError(400, 'Degree name must be less than 200 characters');
}
```

---

## ⚠️ PENDING HIGH-PRIORITY FIXES

### 4. University Domain Authorization
**Status:** ✅ FIXED  
**Priority:** High  
**Risk:** ~~Admins can modify any university's data~~ **RESOLVED**

**Changes Applied:**
- ✅ Added authorization checks in `handleDegreeRequests()`:
  - POST: Verify `request.universityDomain === user.universityDomain`
  - PUT: Fetch existing degree and verify `existingDegree.universityDomain === user.universityDomain`
  - DELETE: Fetch existing degree and verify domain match
- ✅ Added authorization checks in `handleCourseRequests()`:
  - POST: Fetch degree and verify `degree.universityDomain === user.universityDomain`
  - PUT: Fetch existing course and verify `existingCourse.universityDomain === user.universityDomain`
  - DELETE: Fetch existing course and verify domain match
- ✅ Changed handler function signatures to pass full `AuthUser` object instead of just `userId`

**Security Impact:**
- **BEFORE:** Admin from oxford.ac.uk could create/modify degrees for manchester.ac.uk
- **AFTER:** Admins can only manage degrees and courses for their own university domain

**Example Code:**
```typescript
// Degree creation
if (request.universityDomain !== user.universityDomain) {
  return createCorsResponse(403, {
    success: false,
    message: 'You can only create degrees for your own university',
  });
}

// Course update
const existingCourse = await courseService.getCourseById(courseId);
if (existingCourse.universityDomain !== user.universityDomain) {
  return createCorsResponse(403, {
    success: false,
    message: 'You can only update courses at your own university',
  });
}
```

---

### 5. CourseCount Increment
**Status:** ✅ FIXED  
**Priority:** Medium  
**Impact:** ~~UI shows incorrect course counts~~ **RESOLVED**

**Changes Applied:**
- ✅ Created `incrementCourseCount()` helper function in `course.service.ts`
- ✅ Added call to increment (+1) in `createCourse()`
- ✅ Added call to decrement (-1) in `deleteCourse()`
- ✅ Imported `DEGREES_TABLE` constant for UpdateCommand

**Code Added:**
```typescript
// Helper function at end of course.service.ts
async function incrementCourseCount(
  universityDomain: string,
  degreeSlug: string,
  increment: number
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: DEGREES_TABLE,
      Key: { universityDomain, degreeSlug },
      UpdateExpression: 'ADD courseCount :inc',
      ExpressionAttributeValues: { ':inc': increment },
    })
  );
}

// In createCourse() after PutCommand
await incrementCourseCount(degree.universityDomain, degree.degreeSlug, 1);

// In deleteCourse() after soft delete
const degree = await getDegreeById(existing.degreeId);
if (degree) {
  await incrementCourseCount(degree.universityDomain, degree.degreeSlug, -1);
}
```

**Impact:**
- **BEFORE:** `courseCount` always stayed at 0, UI showed misleading data
- **AFTER:** `courseCount` accurately reflects number of active courses in each degree

---

### 6. Soft Delete Filtering
**Status:** ✅ FIXED  
**Priority:** Medium  
**Impact:** ~~Deleted items still appear in list queries~~ **RESOLVED**

**Changes Applied:**
- ✅ Added `FilterExpression` to `listDegreesByUniversity()` in degree.service.ts
- ✅ Added `FilterExpression` to all Query operations in course.service.ts:
  - `getCourseById()`
  - `listCoursesByDegree()`
  - `listCoursesByUniversity()`
  - `getCourseByCode()`

**Code Pattern:**
```typescript
// Before (no filtering)
const result = await docClient.send(
  new QueryCommand({
    TableName: COURSES_TABLE,
    KeyConditionExpression: 'degreeId = :degreeId',
    ExpressionAttributeValues: {
      ':degreeId': degreeId,
    },
  })
);

// After (with active filter)
const result = await docClient.send(
  new QueryCommand({
    TableName: COURSES_TABLE,
    KeyConditionExpression: 'degreeId = :degreeId',
    FilterExpression: 'active = :active',
    ExpressionAttributeValues: {
      ':degreeId': degreeId,
      ':active': true,
    },
  })
);
```

**Impact:**
- **BEFORE:** Soft-deleted items (active=false) still appeared in list results
- **AFTER:** Only active items are returned, maintaining data integrity and UI accuracy

---

## 📋 DEPLOYMENT CHECKLIST

Before deploying this Lambda, ensure:

### Environment Variables (Required)
- [ ] `USER_POOL_ID` - AWS Cognito User Pool ID
- [ ] `CLIENT_ID` - AWS Cognito App Client ID
- [ ] `DEGREES_TABLE` - DynamoDB table name (default: UniversityDegrees)
- [ ] `COURSES_TABLE` - DynamoDB table name (default: DegreeCourses)
- [ ] `AWS_REGION` - AWS Region (default: eu-central-1)

### Lambda Configuration
- [ ] Memory: Minimum 512 MB (JWT verification needs more memory)
- [ ] Timeout: Minimum 10 seconds
- [ ] Runtime: Node.js 18.x or later

### Deployment Commands
```bash
# 1. Build
cd backend/lambda/admin-encyclopedia
npm run build

# 2. Package
npm run package

# 3. Deploy
npm run deploy

# Or manual:
aws lambda update-function-code \
  --function-name AdminEncyclopedia \
  --zip-file fileb://lambda.zip \
  --region eu-central-1 \
  --profile mwsoo3a
```

### Post-Deployment
- [ ] Set environment variables in AWS Lambda console
- [ ] Test with valid JWT token
- [ ] Verify 401 error with invalid token
- [ ] Test degree creation with validation
- [ ] Monitor CloudWatch logs for errors

---

## 🔍 Testing

### Test JWT Verification
```bash
# Should FAIL with 401
curl -X GET \
  https://YOUR_API/admin/degrees?universityDomain=manchester.ac.uk \
  -H "Authorization: Bearer fake.token.here"

# Should SUCCEED with valid token
curl -X GET \
  https://YOUR_API/admin/degrees?universityDomain=manchester.ac.uk \
  -H "Authorization: Bearer <valid-cognito-token>"
```

### Test Input Validation
```bash
# Should FAIL - degree name too long
curl -X POST https://YOUR_API/admin/degrees \
  -H "Authorization: Bearer <token>" \
  -d '{
    "universityDomain": "test.edu",
    "degreeName": "<201+ characters>",
    "degreeType": "undergraduate"
  }'

# Should FAIL - invalid degree type
curl -X POST https://YOUR_API/admin/degrees \
  -H "Authorization: Bearer <token>" \
  -d '{
    "universityDomain": "test.edu",
    "degreeName": "Computer Science",
    "degreeType": "InvalidType"
  }'
```

---

## 📊 Summary

| Issue | Severity | Status | Impact |
|-------|----------|--------|--------|
| JWT Not Verified | 🔴 Critical | ✅ Fixed | Prevented unauthorized access |
| Enum Mismatch | 🟡 High | ✅ Fixed | Fixed frontend-backend communication |
| Input Validation | 🟡 High | ✅ Fixed | Prevented malicious input |
| University Auth | 🟡 High | ✅ Fixed | Prevents cross-university modification |
| CourseCount | 🟢 Medium | ✅ Fixed | UI accuracy and data integrity |
| Soft Delete Filter | 🟢 Medium | ✅ Fixed | Data integrity and correct display |

**Build Status:** ✅ SUCCESS (0 TypeScript errors)  
**Ready for Deployment:** ✅ YES (after env vars configured)  
**All Critical & High Priority Issues:** ✅ RESOLVED

---

## 🚀 Next Steps

1. **Immediate:** Set environment variables in Lambda
2. **Short-term:** Implement university domain authorization
3. **Medium-term:** Fix courseCount updates and soft delete filtering
4. **Long-term:** Apply same fixes to Student Encyclopedia Lambda
