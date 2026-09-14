import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  if (auth.isClient()) return router.createUrlTree(['/client']);
  if (auth.mustChangePassword()) return router.createUrlTree(['/staff/change-password']);
  return router.createUrlTree(['/dashboard']);
};
