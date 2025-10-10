import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { EncyclopediaAdminService, Course, Degree } from '../services/encyclopedia-admin.service';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-courses.component.html',
  styleUrls: ['./admin-courses.component.scss']
})
export class AdminCoursesComponent implements OnInit {
  private adminService = inject(EncyclopediaAdminService);
  private fb = inject(FormBuilder);

  courses: Course[] = [];
  degrees: Degree[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  showForm = false;
  editingCourse: Course | null = null;
  
  courseForm: FormGroup;
  
  // Filters
  selectedUniversity = 'manchester.ac.uk';
  selectedDegree: string | null = null;
  
  universities = [
    { domain: 'manchester.ac.uk', name: 'University of Manchester', country: 'United Kingdom' },
    { domain: 'oxford.ac.uk', name: 'University of Oxford', country: 'United Kingdom' },
    { domain: 'cambridge.ac.uk', name: 'University of Cambridge', country: 'United Kingdom' },
  ];

  constructor() {
    this.courseForm = this.fb.group({
      degreeId: ['', Validators.required],
      courseCode: ['', Validators.required],  // Backend expects courseCode
      courseName: ['', Validators.required],  // Backend expects courseName
      description: ['', Validators.required],
      credits: [10, [Validators.required, Validators.min(1), Validators.max(60)]],
      year: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      semester: ['fall', Validators.required],
      professor: ['']
    });
  }

  ngOnInit(): void {
    this.loadDegrees();
  }

  loadDegrees(): void {
    this.loading = true;
    this.error = null;
    
    this.adminService.listDegrees(this.selectedUniversity).subscribe({
      next: (response: any) => {
        // Handle wrapped response { success: true, data: [...] }
        let degreesArray = response;
        if (response && response.data) {
          degreesArray = response.data;
        }
        
        // Ensure it's an array
        if (!Array.isArray(degreesArray)) {
          degreesArray = [degreesArray];
        }
        
        this.degrees = degreesArray.filter((d: any) => d && d.active === true);
        this.loading = false;
        this.loadCourses();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load degrees';
        this.loading = false;
      }
    });
  }

  loadCourses(): void {
    this.loading = true;
    this.error = null;
    
    const degreeId = this.selectedDegree || undefined;
    const universityDomain = this.selectedUniversity;
    
    this.adminService.listCourses(degreeId, universityDomain).subscribe({
      next: (response: any) => {
        // Handle wrapped response { success: true, data: [...] }
        let coursesArray = response;
        if (response && response.data) {
          coursesArray = response.data;
        }
        
        // Ensure it's an array
        if (!Array.isArray(coursesArray)) {
          coursesArray = [coursesArray];
        }
        
        this.courses = coursesArray.filter((c: any) => c && c.active === true);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load courses';
        this.loading = false;
      }
    });
  }

  onUniversityChange(): void {
    this.selectedDegree = null;
    this.loadDegrees();
  }

  onDegreeChange(): void {
    this.loadCourses();
  }

  getDegreeName(degreeId: string): string {
    return this.degrees.find(d => d.id === degreeId)?.degreeName || 'Unknown';
  }

  openCreateForm(): void {
    if (this.degrees.length === 0) {
      this.error = 'Please create a degree first before adding courses';
      return;
    }

    this.editingCourse = null;
    this.showForm = true;
    
    this.courseForm.reset({
      degreeId: this.degrees[0]?.id || '',
      courseCode: '',
      courseName: '',
      description: '',
      credits: 10,
      year: 1,
      semester: 'fall',
      professor: ''
    });
  }

  openEditForm(course: Course): void {
    this.editingCourse = course;
    this.showForm = true;
    
    this.courseForm.patchValue({
      degreeId: course.degreeId,
      courseCode: course.courseCode,
      courseName: course.courseName,
      description: course.description,
      credits: course.credits,
      year: course.year,
      semester: course.semester,
      professor: course.professor || ''
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingCourse = null;
    this.courseForm.reset();
  }

  saveCourse(): void {
    if (this.courseForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (this.editingCourse) {
      // Update existing course
      const updateData = {
        courseCode: this.courseForm.value.courseCode,
        courseName: this.courseForm.value.courseName,
        description: this.courseForm.value.description,
        credits: this.courseForm.value.credits,
        year: this.courseForm.value.year,
        semester: this.courseForm.value.semester,
        professor: this.courseForm.value.professor || undefined
      };

      this.adminService.updateCourse(this.editingCourse.id, updateData).subscribe({
        next: () => {
          this.successMessage = 'Course updated successfully';
          this.loading = false;
          this.showForm = false;
          this.loadCourses();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update course';
          this.loading = false;
        }
      });
    } else {
      // Create new course
      this.adminService.createCourse(this.courseForm.value).subscribe({
        next: () => {
          this.successMessage = 'Course created successfully';
          this.loading = false;
          this.showForm = false;
          this.loadCourses();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create course';
          this.loading = false;
        }
      });
    }
  }

  deleteCourse(course: Course): void {
    if (!confirm(`Are you sure you want to delete "${course.courseName}"? This will also delete all associated notes.`)) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.adminService.deleteCourse(course.id).subscribe({
      next: () => {
        this.successMessage = 'Course deleted successfully';
        this.loading = false;
        this.loadCourses();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete course';
        this.loading = false;
      }
    });
  }
}
