# Admin Encyclopedia Lambda

Lambda function for managing university degrees and courses.

## Purpose

This Lambda provides admin-only APIs for:
- Creating, updating, and deleting degree programs
- Creating, updating, and deleting courses within degrees
- Managing the encyclopedia structure for all universities

## Authorization

All endpoints require:
- Valid JWT token in `Authorization` header
- `custom:role=admin` attribute in token

## API Endpoints

### Degrees

- `POST /admin/degrees` - Create a new degree
- `GET /admin/degrees` - List all degrees (with filters)
- `GET /admin/degrees/:id` - Get single degree
- `PUT /admin/degrees/:id` - Update degree
- `DELETE /admin/degrees/:id` - Soft delete degree

### Courses

- `POST /admin/courses` - Create a new course
- `GET /admin/courses` - List all courses (with filters)
- `GET /admin/courses/:id` - Get single course
- `PUT /admin/courses/:id` - Update course
- `DELETE /admin/courses/:id` - Soft delete course

## Environment Variables

- `DEGREES_TABLE` - DynamoDB table for degrees (default: UniversityDegrees)
- `COURSES_TABLE` - DynamoDB table for courses (default: DegreeCourses)
- `NOTES_TABLE` - DynamoDB table for notes (default: CourseNotes)
- `AWS_REGION` - AWS region (default: eu-central-1)

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Package

```bash
npm run package
```

### Deploy

```bash
npm run deploy
```

## Deployment

1. **Create Lambda function** (one-time):
   ```bash
   aws lambda create-function \
     --function-name AdminEncyclopedia \
     --runtime nodejs20.x \
     --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
     --handler index.handler \
     --zip-file fileb://lambda.zip \
     --region eu-central-1 \
     --profile mwsoo3a \
     --timeout 30 \
     --environment "Variables={DEGREES_TABLE=UniversityDegrees,COURSES_TABLE=DegreeCourses,NOTES_TABLE=CourseNotes}"
   ```

2. **Update function** (subsequent deploys):
   ```bash
   npm run deploy
   ```

## Testing

Test with curl:

```bash
# Create a degree
curl -X POST https://API_URL/admin/degrees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "universityDomain": "manchester.ac.uk",
    "degreeName": "Computer Science",
    "description": "BSc in Computer Science",
    "degreeType": "Undergraduate"
  }'
```

## Structure

```
src/
├── config/          - AWS clients and environment config
├── middleware/      - Auth and CORS middleware
├── models/          - TypeScript types
├── services/        - Business logic (degrees, courses)
├── utils/           - Helper functions
└── index.ts         - Lambda handler
```
