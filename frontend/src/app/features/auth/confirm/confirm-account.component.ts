import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './confirm-account.component.html',
  styleUrl: './confirm-account.component.scss',
})
export class ConfirmAccountComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly message = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly resendState = signal<'idle' | 'pending' | 'sent'>('idle');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.minLength(4)]],
  });

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({ email });
    }
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.message.set(null);
    this.error.set(null);

    const { email, code } = this.form.getRawValue();

    this.auth
      .confirmSignUp(email!, code!)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this.message.set('Email confirmed successfully. You can now sign in.'),
        error: (err) => this.error.set(this.resolveError(err)),
      });
  }

  resend(): void {
    if (this.form.controls.email.invalid || this.resendState() === 'pending') {
      this.form.controls.email.markAsTouched();
      return;
    }

    this.resendState.set('pending');
    this.error.set(null);
    this.message.set(null);

    const email = this.form.controls.email.value!;

    this.auth
      .resendConfirmationCode(email)
      .pipe(finalize(() => this.resendState.set('idle')))
      .subscribe({
        next: () => this.message.set('We sent a new confirmation code to your email.'),
        error: (err) => this.error.set(this.resolveError(err)),
      });
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
