import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Rutas públicas de marketing: si ya hay una sesión activa, el usuario va directo al panel.
 */
export const publicOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
