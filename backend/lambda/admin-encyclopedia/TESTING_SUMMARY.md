# Admin Encyclopedia Testing Summary

## Overview
All admin degree and course management endpoints have been successfully deployed and tested.

## AWS Resources
- **Account**: 345204682082 (mwsoo3a profile)
- **Region**: eu-central-1
- **Lambda Function**: AdminEncyclopedia
- **API Gateway**: abhyzb0eoe
- **Base URL**: https://abhyzb0eoe.execute-api.eu-central-1.amazonaws.com/prod

## Degree Management Endpoints

### ✅ POST /admin/degrees
**Create a new degree**
```bash
Status: 201 Created
Validation:
- Requires universityDomain and degreeName
- Checks for duplicate degrees (by slug) per university
- Validates university exists in UniversityDomains table
- Auto-generates slug from degree name
```

### ✅ GET /admin/degrees?universityDomain={domain}
**List degrees for a university**
```bash
Status: 200 OK
Returns: Array of degrees for the specified university
```

### ✅ GET /admin/degrees/{id}
**Get a specific degree by ID**
```bash
Status: 200 OK
Returns: Single degree object
```

### ✅ PUT /admin/degrees/{id}
**Update a degree**
```bash
Status: 200 OK
Tested: Updated description successfully
Validation: Degree must exist
```

### ✅ DELETE /admin/degrees/{id}
**Soft delete a degree**
```bash
Status: 200 OK
Behavior: Sets active=false, updates updatedAt
Validation: Cannot delete degree with existing courses
Verified: active field changed to false
```

## Course Management Endpoints

### ✅ POST /admin/courses
**Create a new course**
```bash
Status: 201 Created
Validation:
- Requires degreeId, courseName, and courseCode
- Validates degree exists (404 if not found)
- Validates degree is active (400 if inactive)
- Checks for duplicate courses (by slug) per degree
- Auto-generates slug from course name
```

**Tested Scenarios:**
1. ✅ Valid course creation - Success
2. ✅ Non-existent degree - 404 "Degree not found"
3. ✅ Inactive degree - 400 "Cannot add courses to inactive degree"

### ✅ GET /admin/courses?degreeId={degreeId}
**List courses for a degree**
```bash
Status: 200 OK
Returns: Array of courses for the specified degree
```

### ✅ GET /admin/courses?universityDomain={domain}
**List courses for a university**
```bash
Status: 200 OK
Returns: Array of all courses across all degrees at the university
```

### ✅ GET /admin/courses?universityDomain={domain}&courseCode={code}
**Get course by university and course code**
```bash
Status: 200 OK or 404 Not Found
Returns: Single course object matching the university and code
```

### ✅ GET /admin/courses/{id}
**Get a specific course by ID**
```bash
Status: 200 OK
Returns: Single course object
```

### ✅ PUT /admin/courses/{id}
**Update a course**
```bash
Status: 200 OK
Tested: Updated description and credits successfully
Validation: Course must exist
Updatable fields: courseName, courseCode, description, credits, semester, year, professor, active
```

### ✅ DELETE /admin/courses/{id}
**Soft delete a course**
```bash
Status: 200 OK
Behavior: Sets active=false, updates updatedAt
Validation: Cannot delete course with existing notes
Verified: active field changed to false
```

## Test Data Created

### Degrees
1. **Computer Science** (manchester.ac.uk)
   - Status: Inactive (deleted)
   - ID: deg_a9913b45-4fa2-43c2-b097-54d326c56667

2. **Mathematics** (manchester.ac.uk)
   - Status: Active
   - ID: deg_7f8811da-1766-4bfb-9faa-af322aa241df

### Courses
1. **Linear Algebra** (MATH10101)
   - Degree: Mathematics
   - Status: Inactive (deleted)
   - ID: course_a4eb79d5-e28f-40e3-b937-3f5b6444c9ed

## Security

All endpoints require:
- Valid JWT token in Authorization header
- `custom:role=admin` claim in the token

Unauthorized requests return 403 Forbidden.

## Data Integrity

### Degree Constraints
- Cannot delete degree with existing courses
- Duplicate prevention by universityDomain + degreeSlug
- Requires valid university in UniversityDomains table

### Course Constraints
- Cannot create course without valid degree
- Cannot create course for inactive degree
- Cannot delete course with existing notes
- Duplicate prevention by degreeId + courseSlug
- Unique course codes per university (via GSI)

## API Gateway Resources
```
/admin (5fabpx)
  /degrees (c6a7u0)
    /{id} (rr80y0)
  /courses (b2e5oo)
    /{id} (bfc5zc)
```

## Next Steps
1. Implement note management (upload, download, metadata)
2. Build frontend admin panel for degrees/courses
3. Create student-facing APIs for browsing encyclopedia
4. Add S3 integration for file uploads
5. Implement search and filtering capabilities
