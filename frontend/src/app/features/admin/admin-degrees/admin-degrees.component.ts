import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { EncyclopediaAdminService, Degree } from '../services/encyclopedia-admin.service';

@Component({
  selector: 'app-admin-degrees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-degrees.component.html',
  styleUrls: ['./admin-degrees.component.scss']
})
export class AdminDegreesComponent implements OnInit {
  private adminService = inject(EncyclopediaAdminService);
  private fb = inject(FormBuilder);

  degrees: Degree[] = [];
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  showForm = false;
  editingDegree: Degree | null = null;
  
  degreeForm: FormGroup;
  
  // University filter
  selectedUniversity = 'manchester.ac.uk';
  universities = [
    { domain: 'manchester.ac.uk', name: 'University of Manchester', country: 'United Kingdom' },
    { domain: 'oxford.ac.uk', name: 'University of Oxford', country: 'United Kingdom' },
    { domain: 'cambridge.ac.uk', name: 'University of Cambridge', country: 'United Kingdom' },
  ];

  constructor() {
    this.degreeForm = this.fb.group({
      universityDomain: ['', Validators.required],
      universityName: ['', Validators.required],
      universityCountry: ['', Validators.required],
      degreeName: ['', Validators.required],  // Changed from 'name'
      description: ['', Validators.required],
      degreeType: ['undergraduate', Validators.required]  // Changed from 'level'
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
        
        // Filter only active degrees
        this.degrees = degreesArray.filter((d: any) => d && d.active === true);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load degrees';
        this.loading = false;
      }
    });
  }

  onUniversityChange(): void {
    this.loadDegrees();
  }

  openCreateForm(): void {
    this.editingDegree = null;
    this.showForm = true;
    
    const selectedUni = this.universities.find(u => u.domain === this.selectedUniversity);
    this.degreeForm.reset({
      universityDomain: selectedUni?.domain || '',
      universityName: selectedUni?.name || '',
      universityCountry: selectedUni?.country || '',
      degreeName: '',  // Changed from 'name'
      description: '',
      degreeType: 'undergraduate'  // Changed from 'level'
    });
  }

  openEditForm(degree: Degree): void {
    this.editingDegree = degree;
    this.showForm = true;
    
    this.degreeForm.patchValue({
      universityDomain: degree.universityDomain,
      universityName: degree.universityName,
      universityCountry: degree.universityCountry,
      degreeName: degree.degreeName,  // Changed from 'name'
      description: degree.description,
      degreeType: degree.degreeType  // Changed from 'level'
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingDegree = null;
    this.degreeForm.reset();
  }

  saveDegree(): void {
    if (this.degreeForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    if (this.editingDegree) {
      // Update existing degree
      const updateData = {
        degreeName: this.degreeForm.value.degreeName,  // Changed from 'name'
        description: this.degreeForm.value.description,
        degreeType: this.degreeForm.value.degreeType  // Changed from 'level'
      };

      this.adminService.updateDegree(this.editingDegree.id, updateData).subscribe({
        next: () => {
          this.successMessage = 'Degree updated successfully';
          this.loading = false;
          this.showForm = false;
          this.loadDegrees();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update degree';
          this.loading = false;
        }
      });
    } else {
      // Create new degree
      this.adminService.createDegree(this.degreeForm.value).subscribe({
        next: () => {
          this.successMessage = 'Degree created successfully';
          this.loading = false;
          this.showForm = false;
          this.loadDegrees();
          setTimeout(() => this.successMessage = null, 3000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create degree';
          this.loading = false;
        }
      });
    }
  }

  deleteDegree(degree: Degree): void {
    if (!confirm(`Are you sure you want to delete "${degree.degreeName}"? This will also delete all associated courses and notes.`)) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.successMessage = null;

    this.adminService.deleteDegree(degree.id).subscribe({
      next: () => {
        this.successMessage = 'Degree deleted successfully';
        this.loading = false;
        this.loadDegrees();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to delete degree';
        this.loading = false;
      }
    });
  }
}
