# Admin Encyclopedia Lambda - Deployment Summary

**Deployed:** October 9, 2025  
**Function Name:** AdminEncyclopedia  
**Region:** eu-central-1  
**Status:** ✅ Active

---

## Lambda Configuration

- **Runtime:** Node.js 20.x
- **Handler:** index.handler
- **Timeout:** 30 seconds
- **Memory:** 512 MB
- **Role:** AdminEncyclopediaLambdaRole

### Environment Variables
- `DEGREES_TABLE`: UniversityDegrees
- `COURSES_TABLE`: DegreeCourses
- `NOTES_TABLE`: CourseNotes

---

## IAM Role & Permissions

**Role ARN:** `arn:aws:iam::345204682082:role/AdminEncyclopediaLambdaRole`

### Attached Policies
1. **AWSLambdaBasicExecutionRole** - CloudWatch Logs access
2. **DynamoDBAccess** (inline policy) - Full access to:
   - UniversityDegrees table + indexes
   - DegreeCourses table + indexes
   - CourseNotes table + indexes
   - UniversityDomains table (read-only)

---

## Deployment Commands

### Build & Package
```powershell
cd backend/lambda/admin-encyclopedia
npm install
npm run build
npm run zip
```

### Deploy (Update Lambda Code)
```powershell
npm run deploy
```

Or manually:
```powershell
aws lambda update-function-code `
  --function-name AdminEncyclopedia `
  --zip-file fileb://lambda.zip `
  --region eu-central-1 `
  --profile mwsoo3a
```

---

## API Gateway Integration (TODO)

### Existing API
- **API ID:** abhyzb0eoe
- **API Name:** MWsoo3a API
- **Root Resource ID:** 4xqpu9q5cg

### Resources to Create
```
/admin (resource)
  /admin/degrees (resource)
    POST    - Create degree
    GET     - List degrees
    
    /admin/degrees/{id} (resource)
      GET     - Get degree by ID
      PUT     - Update degree
      DELETE  - Delete degree

  /admin/courses (resource)
    POST    - Create course
    GET     - List courses
    
    /admin/courses/{id} (resource)
      GET     - Get course by ID
      PUT     - Update course
      DELETE  - Delete course
```

### Integration Steps (Manual - AWS Console Recommended)

1. **Create `/admin` resource**
   - Go to API Gateway console
   - Select MWsoo3a API
   - Create resource: `/admin`

2. **Create `/admin/degrees` resource**
   - Create child resource under `/admin`
   - Path: `degrees`
   - Enable CORS

3. **Add ANY method to `/admin/degrees`**
   - Integration type: Lambda Function
   - Lambda: AdminEncyclopedia
   - Use Lambda Proxy Integration: ✅ Yes

4. **Create `/admin/degrees/{id}` resource**
   - Create child resource under `/admin/degrees`
   - Path: `{id}`
   - Enable CORS

5. **Add ANY method to `/admin/degrees/{id}`**
   - Integration type: Lambda Function
   - Lambda: AdminEncyclopedia
   - Use Lambda Proxy Integration: ✅ Yes

6. **Deploy API**
   - Actions → Deploy API
   - Stage: prod
   - URL: `https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod`

---

## Testing

### Test Create Degree (via Frontend or Postman)

**Endpoint:** `POST https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/admin/degrees`

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "universityDomain": "manchester.ac.uk",
  "degreeName": "Computer Science",
  "description": "Bachelor of Science in Computer Science",
  "degreeType": "Undergraduate"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Degree created successfully",
  "data": {
    "id": "deg_...",
    "universityDomain": "manchester.ac.uk",
    "universityName": "University of Manchester",
    "universityCountry": "United Kingdom",
    "degreeName": "Computer Science",
    "degreeSlug": "computer-science",
    ...
  }
}
```

### Test List Degrees

**Endpoint:** `GET https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/admin/degrees?universityDomain=manchester.ac.uk`

**Headers:**
```
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Test Get Degree

**Endpoint:** `GET https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/admin/degrees/{degreeId}`

### Test Update Degree

**Endpoint:** `PUT https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/admin/degrees/{degreeId}`

**Body:**
```json
{
  "description": "Updated description",
  "degreeType": "Graduate"
}
```

### Test Delete Degree

**Endpoint:** `DELETE https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/admin/degrees/{degreeId}`

---

## Monitoring

### CloudWatch Logs
Log Group: `/aws/lambda/AdminEncyclopedia`

View logs:
```powershell
aws logs tail /aws/lambda/AdminEncyclopedia `
  --follow `
  --profile mwsoo3a `
  --region eu-central-1
```

---

## Next Steps

1. ✅ Lambda created and deployed
2. ⏳ Create API Gateway resources
3. ⏳ Test degree management endpoints
4. ⏳ Implement course management
5. ⏳ Build frontend admin panel

---

**Lambda ARN:** `arn:aws:lambda:eu-central-1:345204682082:function:AdminEncyclopedia`  
**Invoke URL (once API Gateway setup):** `https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod/admin/*`
