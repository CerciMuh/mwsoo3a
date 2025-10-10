import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Degree {
  id: string;
  universityDomain: string;
  universityName: string;
  universityCountry: string;
  degreeName: string;  // Backend uses degreeName, not name
  degreeSlug: string;
  description: string;
  degreeType: 'undergraduate' | 'postgraduate' | 'doctorate';  // Backend uses degreeType, not level
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  courseCount?: number;
  noteCount?: number;
}

export interface Course {
  id: string;
  degreeId: string;
  universityDomain: string;
  courseCode: string;  // Backend uses courseCode
  courseName: string;  // Backend uses courseName
  courseSlug: string;
  description: string;
  credits: number;
  year: number;
  semester: 'fall' | 'spring' | 'summer' | 'full-year';
  professor?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  noteCount?: number;
}

export interface CreateDegreeRequest {
  universityDomain: string;
  universityName: string;
  universityCountry: string;
  degreeName: string;  // Backend expects degreeName
  description: string;
  degreeType: 'undergraduate' | 'postgraduate' | 'doctorate';  // Backend expects degreeType
}

export interface UpdateDegreeRequest {
  degreeName?: string;  // Backend expects degreeName
  description?: string;
  degreeType?: 'undergraduate' | 'postgraduate' | 'doctorate';  // Backend expects degreeType
}

export interface CreateCourseRequest {
  degreeId: string;
  courseCode: string;  // Backend expects courseCode
  courseName: string;  // Backend expects courseName
  description: string;
  credits: number;
  year: number;
  semester: 'fall' | 'spring' | 'summer' | 'full-year';
  professor?: string;
}

export interface UpdateCourseRequest {
  courseCode?: string;  // Backend expects courseCode
  courseName?: string;  // Backend expects courseName
  description?: string;
  credits?: number;
  year?: number;
  semester?: 'fall' | 'spring' | 'summer' | 'full-year';
  professor?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EncyclopediaAdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Degree Management
  listDegrees(universityDomain: string): Observable<Degree[]> {
    return this.http.get<Degree[]>(
      `${this.apiUrl}/admin/degrees?universityDomain=${encodeURIComponent(universityDomain)}`
    );
  }

  getDegree(id: string): Observable<Degree> {
    return this.http.get<Degree>(`${this.apiUrl}/admin/degrees/${id}`);
  }

  createDegree(request: CreateDegreeRequest): Observable<Degree> {
    return this.http.post<Degree>(`${this.apiUrl}/admin/degrees`, request);
  }

  updateDegree(id: string, request: UpdateDegreeRequest): Observable<Degree> {
    return this.http.put<Degree>(`${this.apiUrl}/admin/degrees/${id}`, request);
  }

  deleteDegree(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/degrees/${id}`);
  }

  // Course Management
  listCourses(degreeId?: string, universityDomain?: string): Observable<Course[]> {
    let url = `${this.apiUrl}/admin/courses?`;
    if (degreeId) url += `degreeId=${encodeURIComponent(degreeId)}&`;
    if (universityDomain) url += `universityDomain=${encodeURIComponent(universityDomain)}`;
    return this.http.get<Course[]>(url);
  }

  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/admin/courses/${id}`);
  }

  createCourse(request: CreateCourseRequest): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/admin/courses`, request);
  }

  updateCourse(id: string, request: UpdateCourseRequest): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/admin/courses/${id}`, request);
  }

  deleteCourse(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/courses/${id}`);
  }
}
