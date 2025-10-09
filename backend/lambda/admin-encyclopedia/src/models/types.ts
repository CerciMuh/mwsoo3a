/**
 * TypeScript type definitions for Encyclopedia entities
 */

// Degree entity
export interface Degree {
  id: string;
  universityDomain: string;
  universityName: string;
  universityCountry: string;
  degreeName: string;
  degreeSlug: string;
  description?: string;
  degreeType?: 'Undergraduate' | 'Graduate' | 'PhD' | 'Certificate';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  courseCount: number;
  noteCount: number;
  active: boolean;
}

// Course entity
export interface Course {
  id: string;
  degreeId: string;
  universityDomain: string;
  courseCode: string;
  courseName: string;
  courseSlug: string;
  description?: string;
  semester?: string;
  year?: string;
  professor?: string;
  credits?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
  active: boolean;
}

// Note entity (for future use)
export interface Note {
  id: string;
  courseId: string;
  degreeId: string;
  universityDomain: string;
  title: string;
  description?: string;
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  semester?: string;
  topics: string[];
  uploadedBy: string;
  uploaderName: string;
  uploaderEmail: string;
  upvotes: number;
  downvotes: number;
  downloads: number;
  views: number;
  aiProcessed: boolean;
  aiSummary?: string;
  aiTopics: string[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// Request/Response types
export interface CreateDegreeRequest {
  universityDomain: string;
  degreeName: string;
  description?: string;
  degreeType?: 'Undergraduate' | 'Graduate' | 'PhD' | 'Certificate';
}

export interface UpdateDegreeRequest {
  degreeName?: string;
  description?: string;
  degreeType?: 'Undergraduate' | 'Graduate' | 'PhD' | 'Certificate';
  active?: boolean;
}

export interface CreateCourseRequest {
  degreeId: string;
  courseCode: string;
  courseName: string;
  description?: string;
  semester?: string;
  year?: string;
  professor?: string;
  credits?: number;
}

export interface UpdateCourseRequest {
  courseCode?: string;
  courseName?: string;
  description?: string;
  semester?: string;
  year?: string;
  professor?: string;
  credits?: number;
  active?: boolean;
}

// JWT Token payload
export interface TokenPayload {
  sub: string; // User ID
  email: string;
  'custom:role'?: string;
  'custom:userType'?: 'student' | 'regular';
  'custom:universityDomain'?: string;
  'custom:universityName'?: string;
  'custom:universityCountry'?: string;
}

// Authenticated user context
export interface AuthUser {
  userId: string;
  email: string;
  role?: string;
  userType?: 'student' | 'regular';
  universityDomain?: string;
}
