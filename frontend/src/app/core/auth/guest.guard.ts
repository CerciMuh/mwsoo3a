import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { AuthService } from './auth.service';

export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  return auth.requireGuest();
};
