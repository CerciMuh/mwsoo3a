import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      birthdate: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      updatedAt: [String(Math.floor(Date.now() / 1000))],

    },
    { validators: this.matchPasswords },
  );

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { name, email, birthdate, phoneNumber, password, updatedAt } = this.form.getRawValue();

    this.auth
      .signUp({
        name: name!,
        email: email!,
        birthdate: birthdate!,
        phoneNumber: phoneNumber!,
        password: password!,
        updated_at: updatedAt!
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/auth/confirm'], { queryParams: { email } }),
        error: (err) => this.error.set(this.resolveError(err)),
      });
  }

  private matchPasswords(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  }

  private resolveError(err: unknown): string {
    if (!err) return 'Unable to sign up. Please try again.';
    if (typeof err === 'string') return err;
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'object' && 'message' in (err as Record<string, unknown>)) {
      const message = (err as { message?: string }).message;
      if (message) return message;
    }
    return 'Unable to sign up. Please try again.';
  }
}
