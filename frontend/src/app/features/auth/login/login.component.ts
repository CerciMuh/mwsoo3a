import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({ email });
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.error.set(null);
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();
    this.auth
      .login(email!, password!)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/home'),
        error: (err) => {
          if (this.isUserNotConfirmed(err)) {
            this.router.navigate(['/auth/confirm'], { queryParams: { email } });
            return;
          }
          this.error.set(this.normalizeError(err));
        },
      });
  }

  private isUserNotConfirmed(err: unknown): boolean {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      return (err as { code?: string }).code === 'UserNotConfirmedException';
    }
    return false;
  }

  private normalizeError(err: unknown): string {
    if (!err) return 'Unable to sign in. Please try again.';
    if (typeof err === 'string') return err;
    if (err instanceof Error && err.message) return err.message;

    if (typeof err === 'object') {
      const { message } = err as { message?: string };
      if (message) return message;
    }

    return 'Unable to sign in. Please try again.';
  }

  public Signup() {
    this.router.navigate(['/auth/register']);
  }
  public ForgetPassword() {
    this.router.navigate(['/auth/forgot-password']);
  }
}
