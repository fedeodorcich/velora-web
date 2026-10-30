import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Rutas donde un 401 es parte del flujo normal (credenciales incorrectas). */
const AUTH_ROUTES = ['/login', '/registro'];

/**
 * Adjunta el token JWT a cada petición y cierra la sesión ante un 401.
 * Si el token venció mientras se navegaba el panel, además vuelve al login.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();

        const path = router.url.split(/[?#]/)[0];
        if (!AUTH_ROUTES.includes(path)) {
          void router.navigateByUrl('/login');
        }
      }
      return throwError(() => error);
    }),
  );
};
