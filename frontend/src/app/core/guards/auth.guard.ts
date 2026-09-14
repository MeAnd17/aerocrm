import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/']);
  // Staff with mustChangePassword → force to change-password screen
  if (auth.isStaff() && auth.mustChangePassword()) return router.createUrlTree(['/staff/change-password']);
  return true;
};

export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/']);
  if (auth.isClient()) return router.createUrlTree(['/client']);
  if (auth.mustChangePassword()) return router.createUrlTree(['/staff/change-password']);
  return true;
};

export const clientGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/']);
  if (auth.isStaff()) return router.createUrlTree(['/dashboard']);
  return true;
};

export const changePasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return router.createUrlTree(['/']);
  if (!auth.mustChangePassword()) return router.createUrlTree(['/dashboard']);
  return true;
};
