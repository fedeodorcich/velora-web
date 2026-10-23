import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { publicOnlyGuard } from './public-only.guard';

const route = {} as unknown as ActivatedRouteSnapshot;
const state = {} as unknown as RouterStateSnapshot;

function setup(isAuthenticated: boolean): void {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } },
    ],
  });
}

describe('publicOnlyGuard', () => {
  it('deja pasar a un visitante sin sesión', () => {
    setup(false);

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard(route, state));

    expect(result).toBe(true);
  });

  it('manda al panel a un usuario que ya tiene sesión', () => {
    setup(true);
    const router = TestBed.inject(Router);

    const result = TestBed.runInInjectionContext(() => publicOnlyGuard(route, state));

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/clientes');
  });
});
