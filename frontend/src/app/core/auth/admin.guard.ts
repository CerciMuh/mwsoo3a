import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.requireAuthenticated().pipe(
    map((result) => {
      // If not authenticated, requireAuthenticated already handles redirect
      if (result !== true) {
        return result;
      }

      // Check if user is admin
      if (!authService.isAdmin()) {
        return router.parseUrl('/home');
      }

      return true;
    })
  );
};
