import { Component } from '@angular/core';

@Component({
  selector: 'app-university',
  standalone: true,
  imports: [],
  template: `
    <div class="container mt-4">
      <h1>University Section</h1>
      <p class="text-muted">Welcome to the university section. This area is only accessible to students.</p>
      <div class="alert alert-info" role="alert">
        <strong>Coming soon!</strong> University features will be added here.
      </div>
    </div>
  `,
  styles: ``,
})
export class UniversityComponent {}
