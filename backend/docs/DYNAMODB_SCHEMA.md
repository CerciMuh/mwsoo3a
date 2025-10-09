# DynamoDB Schema Design

**Feature:** Encyclopedia (Degrees, Courses, Notes)  
**Date:** October 9, 2025  
**Region:** eu-central-1

---

## Overview

The encyclopedia feature uses 3 DynamoDB tables to store hierarchical data:

1. **UniversityDegrees** - Degree programs at each university
2. **DegreeCourses** - Courses within each degree program
3. **CourseNotes** - Student-uploaded notes for each course

---

## Table 1: UniversityDegrees

### Purpose
Store degree programs (e.g., Computer Science, Medicine) offered at each university.

### Schema

**Primary Key:**
- **Partition Key (PK):** `universityDomain` (String) - e.g., "manchester.ac.uk"
- **Sort Key (SK):** `degreeSlug` (String) - e.g., "computer-science"

**Attributes:**

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | String | Unique degree ID (UUID) | "deg_abc123" |
| `universityDomain` | String | University domain (from UniversityDomains) | "manchester.ac.uk" |
| `universityName` | String | Full university name | "University of Manchester" |
| `universityCountry` | String | Country | "United Kingdom" |
| `degreeName` | String | Degree program name | "Computer Science" |
| `degreeSlug` | String | URL-friendly slug | "computer-science" |
| `description` | String | Optional description | "BSc in Computer Science" |
| `degreeType` | String | Degree level | "Undergraduate", "Graduate", "PhD" |
| `createdBy` | String | User ID who created it | "user_123" |
| `createdAt` | String | ISO timestamp | "2025-10-09T10:00:00Z" |
| `updatedAt` | String | ISO timestamp | "2025-10-09T10:00:00Z" |
| `courseCount` | Number | Number of courses | 25 |
| `noteCount` | Number | Total notes across all courses | 145 |
| `active` | Boolean | Soft delete flag | true |

**Global Secondary Indexes:**

1. **degreeId-index**
   - Partition Key: `id`
   - Purpose: Look up degree by ID

### Example Item

```json
{
  "universityDomain": "manchester.ac.uk",
  "degreeSlug": "computer-science",
  "id": "deg_abc123",
  "universityName": "University of Manchester",
  "universityCountry": "United Kingdom",
  "degreeName": "Computer Science",
  "description": "Bachelor of Science in Computer Science",
  "degreeType": "Undergraduate",
  "createdBy": "user_admin_123",
  "createdAt": "2025-10-09T10:00:00.000Z",
  "updatedAt": "2025-10-09T10:00:00.000Z",
  "courseCount": 15,
  "noteCount": 87,
  "active": true
}
```

---

## Table 2: DegreeCourses

### Purpose
Store individual courses within degree programs.

### Schema

**Primary Key:**
- **Partition Key (PK):** `degreeId` (String) - Links to UniversityDegrees.id
- **Sort Key (SK):** `courseSlug` (String) - e.g., "data-structures-101"

**Attributes:**

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | String | Unique course ID (UUID) | "course_xyz789" |
| `degreeId` | String | Parent degree ID | "deg_abc123" |
| `universityDomain` | String | University domain | "manchester.ac.uk" |
| `courseCode` | String | Official course code | "COMP1001" |
| `courseName` | String | Course name | "Data Structures 101" |
| `courseSlug` | String | URL-friendly slug | "data-structures-101" |
| `description` | String | Optional description | "Introduction to data structures" |
| `semester` | String | Optional semester | "Fall 2025" |
| `year` | String | Optional year level | "Year 1" |
| `professor` | String | Optional professor name | "Dr. Smith" |
| `credits` | Number | Optional credit hours | 3 |
| `createdBy` | String | User ID who created it | "user_admin_123" |
| `createdAt` | String | ISO timestamp | "2025-10-09T10:00:00Z" |
| `updatedAt` | String | ISO timestamp | "2025-10-09T10:00:00Z" |
| `noteCount` | Number | Number of notes | 23 |
| `active` | Boolean | Soft delete flag | true |

**Global Secondary Indexes:**

1. **courseId-index**
   - Partition Key: `id`
   - Purpose: Look up course by ID

2. **universityDomain-courseCode-index**
   - Partition Key: `universityDomain`
   - Sort Key: `courseCode`
   - Purpose: Search courses by code within a university

### Example Item

```json
{
  "degreeId": "deg_abc123",
  "courseSlug": "data-structures-101",
  "id": "course_xyz789",
  "universityDomain": "manchester.ac.uk",
  "courseCode": "COMP1001",
  "courseName": "Data Structures 101",
  "description": "Introduction to fundamental data structures including arrays, linked lists, trees, and graphs",
  "semester": "Fall 2025",
  "year": "Year 1",
  "professor": "Dr. Jane Smith",
  "credits": 3,
  "createdBy": "user_admin_123",
  "createdAt": "2025-10-09T10:00:00.000Z",
  "updatedAt": "2025-10-09T10:00:00.000Z",
  "noteCount": 23,
  "active": true
}
```

---

## Table 3: CourseNotes

### Purpose
Store student-uploaded notes (files) for each course.

### Schema

**Primary Key:**
- **Partition Key (PK):** `courseId` (String) - Links to DegreeCourses.id
- **Sort Key (SK):** `createdAt#id` (String) - Composite: "2025-10-09T10:00:00Z#note_123"

**Attributes:**

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | String | Unique note ID (UUID) | "note_123456" |
| `courseId` | String | Parent course ID | "course_xyz789" |
| `degreeId` | String | Parent degree ID | "deg_abc123" |
| `universityDomain` | String | University domain | "manchester.ac.uk" |
| `title` | String | Note title | "Binary Trees Complete Guide" |
| `description` | String | Optional description | "Comprehensive notes on binary trees with examples" |
| `fileKey` | String | S3 object key | "notes/manchester.ac.uk/computer-science/comp1001/uuid.pdf" |
| `fileName` | String | Original filename | "binary-trees-guide.pdf" |
| `fileType` | String | File extension | "pdf" |
| `fileSize` | Number | File size in bytes | 2048576 |
| `semester` | String | Optional semester | "Fall 2025" |
| `topics` | List<String> | Search tags | ["binary-trees", "algorithms", "recursion"] |
| `uploadedBy` | String | User ID | "user_456" |
| `uploaderName` | String | Display name | "Ali Almuhtaseb" |
| `uploaderEmail` | String | Email | "ali.almuhtaseb@student.manchester.ac.uk" |
| `upvotes` | Number | Upvote count | 15 |
| `downvotes` | Number | Downvote count | 2 |
| `downloads` | Number | Download count | 42 |
| `views` | Number | View count | 156 |
| `aiProcessed` | Boolean | AI processing status | false |
| `aiSummary` | String | AI-generated summary | null |
| `aiTopics` | List<String> | AI-extracted topics | [] |
| `createdAt` | String | ISO timestamp | "2025-10-09T10:00:00.000Z" |
| `updatedAt` | String | ISO timestamp | "2025-10-09T10:00:00.000Z" |
| `active` | Boolean | Soft delete flag | true |

**Global Secondary Indexes:**

1. **noteId-index**
   - Partition Key: `id`
   - Purpose: Look up note by ID

2. **uploadedBy-createdAt-index**
   - Partition Key: `uploadedBy`
   - Sort Key: `createdAt`
   - Purpose: Get all notes uploaded by a user

3. **courseId-upvotes-index**
   - Partition Key: `courseId`
   - Sort Key: `upvotes`
   - Purpose: Sort notes by popularity

### Example Item

```json
{
  "courseId": "course_xyz789",
  "createdAt#id": "2025-10-09T10:00:00.000Z#note_123456",
  "id": "note_123456",
  "degreeId": "deg_abc123",
  "universityDomain": "manchester.ac.uk",
  "title": "Binary Trees Complete Guide",
  "description": "Comprehensive notes covering binary trees, BST, AVL trees, and tree traversal algorithms",
  "fileKey": "notes/manchester.ac.uk/computer-science/comp1001/abc-123-456.pdf",
  "fileName": "binary-trees-guide.pdf",
  "fileType": "pdf",
  "fileSize": 2048576,
  "semester": "Fall 2025",
  "topics": ["binary-trees", "bst", "algorithms", "recursion"],
  "uploadedBy": "user_456",
  "uploaderName": "Ali Almuhtaseb",
  "uploaderEmail": "ali.almuhtaseb@student.manchester.ac.uk",
  "upvotes": 15,
  "downvotes": 2,
  "downloads": 42,
  "views": 156,
  "aiProcessed": false,
  "aiSummary": null,
  "aiTopics": [],
  "createdAt": "2025-10-09T10:00:00.000Z",
  "updatedAt": "2025-10-09T10:00:00.000Z",
  "active": true
}
```

---

## Table Configuration

### Billing Mode
- **On-Demand** (recommended for variable traffic)
- Automatically scales with usage
- No capacity planning required

### Encryption
- **Encryption at rest:** Enabled (AWS managed keys)
- **Encryption in transit:** TLS 1.2+

### Backup
- **Point-in-time recovery:** Enabled
- **Retention:** 35 days

---

## Access Patterns

### Admin Operations

1. **List all degrees for a university**
   - Query: `universityDomain = "manchester.ac.uk"`
   - Table: UniversityDegrees

2. **List all courses for a degree**
   - Query: `degreeId = "deg_abc123"`
   - Table: DegreeCourses

3. **Get degree by ID**
   - Query: `id = "deg_abc123"` (using degreeId-index)
   - Table: UniversityDegrees

4. **Get course by ID**
   - Query: `id = "course_xyz789"` (using courseId-index)
   - Table: DegreeCourses

### Student Operations

1. **Browse degrees at my university**
   - Query: `universityDomain = "manchester.ac.uk"`
   - Table: UniversityDegrees

2. **Browse courses in a degree**
   - Query: `degreeId = "deg_abc123"`
   - Table: DegreeCourses

3. **List notes for a course (sorted by date)**
   - Query: `courseId = "course_xyz789"`
   - Table: CourseNotes

4. **List notes for a course (sorted by popularity)**
   - Query: `courseId = "course_xyz789"` (using courseId-upvotes-index)
   - Table: CourseNotes

5. **Get my uploaded notes**
   - Query: `uploadedBy = "user_456"` (using uploadedBy-createdAt-index)
   - Table: CourseNotes

---

## Cost Estimation

### Assumptions
- 1,000 universities with data
- Average 20 degrees per university = 20,000 degrees
- Average 30 courses per degree = 600,000 courses
- Average 10 notes per course = 6,000,000 notes

### Storage Costs (On-Demand)
- DynamoDB storage: ~$0.25 per GB/month
- Estimated total: **~$15-30/month** for metadata

### Request Costs (On-Demand)
- Read: $0.25 per million requests
- Write: $1.25 per million requests
- Estimated: **~$5-20/month** for typical traffic

**Total estimated cost: $20-50/month** for DynamoDB

---

## Data Integrity

### Relationships
- DegreeCourses.degreeId → UniversityDegrees.id
- CourseNotes.courseId → DegreeCourses.id
- CourseNotes.degreeId → UniversityDegrees.id (denormalized for faster queries)

### Aggregated Counts
- UniversityDegrees.courseCount is updated when courses are added/deleted
- UniversityDegrees.noteCount is updated when notes are added/deleted
- DegreeCourses.noteCount is updated when notes are added/deleted

### Soft Deletes
- All tables use `active: boolean` flag
- Deleted items are marked `active: false` instead of being removed
- Allows for data recovery and audit trails

---

## Migration & Seeding

### Initial Data
1. Admin manually adds degrees via admin panel
2. Admin manually adds courses via admin panel
3. Students upload notes

### Future Enhancements
- Bulk import CSV for degrees/courses
- API to sync with university course catalogs
- Student-generated degree/course creation with moderation

---

**Last Updated:** October 9, 2025
