import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly step = signal<'request' | 'reset'>('request');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly email = signal<string>('');

  readonly requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly resetForm = this.fb.group(
    {
      code: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: this.matchPasswords },
  );

  readonly isResetStep = computed(() => this.step() === 'reset');

  submitRequest(): void {
    if (this.requestForm.invalid || this.loading()) {
      this.requestForm.markAllAsTouched();
      return;
    }

    const { email } = this.requestForm.getRawValue();
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.auth
      .forgotPassword(email!)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.email.set(email!);
          this.step.set('reset');
          this.message.set('We sent a verification code to your email. Enter it below to choose a new password.');
        },
        error: (err) => this.error.set(this.resolveError(err)),
      });
  }

  submitReset(): void {
    if (this.resetForm.invalid || this.loading()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { code, password } = this.resetForm.getRawValue();
    const email = this.email();

    if (!email) {
      this.error.set('Please restart the password reset flow.');
      this.step.set('request');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth
      .confirmForgotPassword(email, code!, password!)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.message.set('Password updated successfully. You can sign in with your new password.');
          this.step.set('request');
          this.requestForm.patchValue({ email });
          this.resetForm.reset();
        },
        error: (err) => this.error.set(this.resolveError(err)),
      });
  }

  backToRequest(): void {
    this.step.set('request');
    this.resetForm.reset();
    this.message.set(null);
    this.error.set(null);
    this.email.set('');
  }

  private matchPasswords(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirm = control.get('confirmPassword')?.value;
    if (!password || !confirm) return null;
    return password === confirm ? null : { passwordMismatch: true };
  }

  private resolveError(err: unknown): string {
    if (!err) return 'Something went wrong. Please try again.';
    if (typeof err === 'string') return err;
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'object' && 'message' in (err as Record<string, unknown>)) {
      const message = (err as { message?: string }).message;
      if (message) return message;
    }
    return 'Something went wrong. Please try again.';
  }
}


