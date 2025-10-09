/**
 * TypeScript type definitions for Student Encyclopedia
 */

// Reusing types from admin (same database entities)
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

// JWT Token payload
export interface TokenPayload {
  sub: string;
  email: string;
  iss?: string;
  'custom:role'?: string;
  'custom:userType'?: 'student' | 'regular';
  'custom:universityDomain'?: string;
  'custom:universityName'?: string;
  'custom:universityCountry'?: string;
}

// Authenticated student context
export interface AuthStudent {
  userId: string;
  email: string;
  userType?: 'student' | 'regular';
  universityDomain: string;
  universityName?: string;
  universityCountry?: string;
}
