import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Sin sesión, manda al login recordando a dónde quería ir (returnUrl). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  return true;
};

/** Solo para la ruta /admin: requiere sesión activa y rol ADMIN. */
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (auth.currentUser()?.role !== 'ADMIN') {
    return router.createUrlTree(['/home']);
  }
  return true;
};

export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    const role = auth.currentUser()?.role;
    return router.createUrlTree([role === 'ADMIN' ? '/admin' : '/home']);
  }
  return true;
};

/**
 * Ruta a la que volver después de iniciar sesión o registrarse.
 * Solo se aceptan rutas internas, para no redirigir a otro sitio.
 */
export function safeReturnUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/home';
  return value;
}
