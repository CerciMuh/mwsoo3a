# Encyclopedia Feature - Implementation Guide

**Feature Branch:** `feature/encyclopedia-foundation`  
**Status:** In Progress  
**Started:** October 9, 2025

---

## 🎯 Feature Overview

Transform MWsoo3a into a **university course notes encyclopedia** where students can:
1. Browse degrees offered at their university
2. Explore courses within each degree
3. Upload and download course notes (PDF, DOCX, PPTX, XLSX)
4. Access university-specific content only

---

## 📊 Data Model

### Hierarchy

```
University (from existing UniversityDomains table)
  └── Degree (Computer Science, Medicine, Law, etc.)
      └── Course (COMP1001: Data Structures 101)
          └── Note (Binary Trees Guide.pdf)
```

### Database Tables

#### 1. **UniversityDegrees**

```javascript
{
  PK: "UNIV#manchester.ac.uk",           // Partition Key
  SK: "DEGREE#computer-science",          // Sort Key
  id: "degree_uuid",
  universityDomain: "manchester.ac.uk",
  universityName: "University of Manchester",
  universityCountry: "United Kingdom",
  degreeName: "Computer Science",
  degreeSlug: "computer-science",
  description: "BSc in Computer Science",  // Optional
  createdBy: "admin_user_id",
  createdAt: "2025-10-09T10:00:00Z",
  updatedAt: "2025-10-09T10:00:00Z",
  courseCount: 25,                         // Aggregated
  noteCount: 145,                          // Aggregated
  active: true
}
```

**Indexes:**
- GSI: `universityDomain-degreeName-index`

---

#### 2. **DegreeCourses**

```javascript
{
  PK: "DEGREE#degree_uuid",                // Partition Key
  SK: "COURSE#comp1001",                   // Sort Key
  id: "course_uuid",
  degreeId: "degree_uuid",
  universityDomain: "manchester.ac.uk",
  courseCode: "COMP1001",
  courseName: "Data Structures 101",
  courseSlug: "data-structures-101",
  description: "Introduction to data structures",
  semester: "Fall 2025",                   // Optional
  year: "Year 1",                          // Optional
  professor: "Dr. Smith",                  // Optional
  createdBy: "admin_user_id",
  createdAt: "2025-10-09T10:00:00Z",
  updatedAt: "2025-10-09T10:00:00Z",
  noteCount: 23,                           // Aggregated
  active: true
}
```

**Indexes:**
- GSI: `degreeId-courseName-index`
- GSI: `universityDomain-courseCode-index`

---

#### 3. **CourseNotes**

```javascript
{
  PK: "COURSE#course_uuid",                // Partition Key
  SK: "NOTE#2025-10-09#note_uuid",        // Sort Key
  id: "note_uuid",
  courseId: "course_uuid",
  degreeId: "degree_uuid",
  universityDomain: "manchester.ac.uk",
  
  // Content
  title: "Binary Trees Complete Guide",
  description: "Comprehensive notes on binary trees with examples",
  fileKey: "notes/manchester/comp-sci/comp1001/uuid.pdf",
  fileUrl: "https://s3.../uuid.pdf",       // Presigned URL (temporary)
  fileName: "binary-trees-guide.pdf",
  fileType: "pdf",                         // pdf, docx, pptx, xlsx
  fileSize: 2048576,                       // bytes
  
  // Metadata
  semester: "Fall 2025",
  topics: ["binary-trees", "algorithms"],  // For search
  
  // Author
  uploadedBy: "user_uuid",
  uploaderName: "Ali",
  uploaderEmail: "ali@student.manchester.ac.uk",
  
  // Engagement
  upvotes: 15,
  downvotes: 2,
  downloads: 42,
  views: 156,
  
  // AI Processing (future)
  aiProcessed: false,
  aiSummary: null,
  aiTopics: [],
  
  // Timestamps
  createdAt: "2025-10-09T10:00:00Z",
  updatedAt: "2025-10-09T10:00:00Z",
  active: true
}
```

**Indexes:**
- GSI: `courseId-createdAt-index` (list notes by date)
- GSI: `uploadedBy-createdAt-index` (user's uploads)
- GSI: `courseId-upvotes-index` (sort by popularity)

---

## 🔐 Authorization Model

### Roles

1. **Admin** (`custom:role=admin`)
   - Manage degrees for ALL universities
   - Manage courses for ALL degrees
   - View all notes
   - Delete inappropriate content

2. **Student** (`custom:userType=student`)
   - View degrees/courses/notes at THEIR university only
   - Upload notes to courses at their university
   - Delete their own notes
   - Upvote/downvote notes

3. **Regular User** (`custom:userType=regular`)
   - No access to encyclopedia (student-only feature)

---

## 🛠️ API Endpoints

### Admin APIs

```
POST   /admin/degrees                     - Create degree
GET    /admin/degrees                     - List all degrees (all universities)
GET    /admin/degrees/:id                 - Get single degree
PUT    /admin/degrees/:id                 - Update degree
DELETE /admin/degrees/:id                 - Delete degree

POST   /admin/courses                     - Create course
GET    /admin/courses                     - List all courses (optionally filter by degree)
GET    /admin/courses/:id                 - Get single course
PUT    /admin/courses/:id                 - Update course
DELETE /admin/courses/:id                 - Delete course

GET    /admin/notes                       - List all notes (with filters)
DELETE /admin/notes/:id                   - Delete note (moderation)
```

### Student APIs

```
GET    /university/degrees                - Get degrees at my university
GET    /university/degrees/:id            - Get single degree details
GET    /university/degrees/:id/courses    - Get courses in a degree

GET    /university/courses/:id            - Get single course details
GET    /university/courses/:id/notes      - Get notes in a course

POST   /university/notes                  - Upload note
GET    /university/notes/:id              - Get note details
GET    /university/notes/:id/download     - Download note (presigned S3 URL)
PUT    /university/notes/:id/vote         - Upvote/downvote note
DELETE /university/notes/:id              - Delete my note
```

---

## 📁 File Storage (S3)

### Bucket Structure

```
s3://mwsoo3a-course-notes/
  notes/
    manchester.ac.uk/
      computer-science/
        comp1001/
          uuid1.pdf
          uuid2.docx
    stanford.edu/
      medicine/
        med101/
          uuid3.pdf
```

### Upload Flow (Presigned URLs)

```
1. Student clicks "Upload Note"
2. Frontend calls: POST /university/notes/upload-url
   {
     "courseId": "course_uuid",
     "fileName": "notes.pdf",
     "fileType": "pdf",
     "fileSize": 2048576
   }
3. Backend generates presigned S3 URL (expires in 5 minutes)
4. Frontend uploads file directly to S3 using presigned URL
5. On success, frontend calls: POST /university/notes
   {
     "courseId": "course_uuid",
     "title": "Binary Trees Guide",
     "description": "...",
     "fileKey": "notes/manchester/comp-sci/comp1001/uuid.pdf"
   }
6. Backend creates note record in DynamoDB
```

### Allowed File Types

- ✅ **PDF** (.pdf) - Primary format
- ✅ **Word** (.doc, .docx)
- ✅ **PowerPoint** (.ppt, .pptx)
- ✅ **Excel** (.xls, .xlsx)
- ❌ Executables, archives (security risk)

### File Size Limits

- **Maximum:** 50 MB per file
- **Recommended:** Under 10 MB for faster downloads

---

## 🎨 Frontend Routes

### Admin Routes

```typescript
{
  path: 'admin',
  canMatch: [adminGuard],
  children: [
    { path: '', component: AdminDashboardComponent },
    { path: 'universities', component: UniversityListComponent },
    { path: 'universities/:domain/degrees', component: DegreeManagerComponent },
    { path: 'degrees/:id/courses', component: CourseManagerComponent }
  ]
}
```

### Student Routes

```typescript
{
  path: 'university',
  canMatch: [studentGuard],
  children: [
    { path: '', component: DegreesListComponent },
    { path: 'degrees/:id', component: CoursesListComponent },
    { path: 'courses/:id', component: NotesListComponent },
    { path: 'notes/:id', component: NoteDetailComponent },
    { path: 'upload', component: UploadNoteComponent }
  ]
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (This Branch)
- ✅ Database schema design
- ✅ Admin role setup
- ✅ Create DynamoDB tables
- ✅ Admin Lambda functions (degrees & courses)
- ✅ Admin frontend (manage degrees & courses)

### Phase 2: Student Experience
- ✅ Student Lambda functions (browse & upload)
- ✅ Student frontend (browse degrees/courses)
- ✅ S3 file upload integration
- ✅ Basic note upload/download

### Phase 3: Enhancement
- ✅ Search functionality
- ✅ Upvote/downvote system
- ✅ User reputation
- ✅ AI note summaries (Claude API)

### Phase 4: Scale & Polish
- ✅ Seed top 50 universities
- ✅ Performance optimization
- ✅ Analytics dashboard
- ✅ Mobile responsive design

---

## 📋 Current Status

### Completed
- ✅ Admin role documentation

### In Progress
- ⏳ DynamoDB table definitions
- ⏳ Admin Lambda implementation
- ⏳ Admin frontend

### Upcoming
- 📅 Student APIs
- 📅 Student UI
- 📅 S3 integration
- 📅 File upload

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Admin Flow:**
1. ✅ Login as admin
2. ✅ See "Admin" link in navigation
3. ✅ Create degree "Computer Science" at Manchester
4. ✅ Create course "COMP1001" in Computer Science
5. ✅ Verify course appears in list

**Student Flow:**
1. ✅ Login as Manchester student
2. ✅ Navigate to University section
3. ✅ See "Computer Science" degree
4. ✅ Click degree → See "COMP1001" course
5. ✅ Upload note to course
6. ✅ Download uploaded note

**Authorization:**
1. ✅ Regular user cannot access /university
2. ✅ Student cannot access /admin
3. ✅ Oxford student cannot see Manchester degrees
4. ✅ Student can only delete their own notes

---

## 🔧 Development Setup

### Backend Lambda Setup

```bash
cd backend/lambda/admin-encyclopedia
npm install
npm run build
npm run deploy
```

### Frontend Development

```bash
cd frontend
npm install
ng serve
# Visit http://localhost:4200
```

### DynamoDB Local (Optional)

```bash
# For local testing
docker run -p 8000:8000 amazon/dynamodb-local
```

---

## 📚 Related Documentation

- [Admin Role Setup](../backend/docs/ADMIN_ROLE_SETUP.md)
- [API Gateway Setup](../backend/docs/API_GATEWAY_SETUP.md)
- [University Feature Summary](./UNIVERSITY_FEATURE_SUMMARY.md)

---

## 🐛 Known Issues & Limitations

### Current Limitations
- No duplicate degree detection (admin must avoid duplicates manually)
- No course code validation (admin can enter any format)
- No file type validation on backend (only frontend)
- No virus scanning on uploaded files

### Future Improvements
- Fuzzy matching for degree/course names
- Auto-suggest course codes based on university patterns
- Backend file validation with AWS Lambda
- S3 integration with CloudFront CDN
- Full-text search with OpenSearch

---

**Last Updated:** October 9, 2025  
**Next Review:** After Phase 1 completion
