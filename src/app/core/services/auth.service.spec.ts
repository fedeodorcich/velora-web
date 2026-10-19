import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const authResponse = {
    accessToken: 'token-1',
    user: { id: 'u1', email: 'ana@devcrm.test', name: 'Ana' },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('arranca sin sesión activa', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('guarda token y usuario al iniciar sesión', () => {
    service.login({ email: 'ana@devcrm.test', password: 'secreto123' }).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush(authResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('token-1');
    expect(service.user()?.name).toBe('Ana');
    expect(localStorage.getItem('devcrm_token')).toBe('token-1');
  });

  it('limpia la sesión al cerrar sesión', () => {
    service.login({ email: 'ana@devcrm.test', password: 'secreto123' }).subscribe();
    httpMock.expectOne(`${API_BASE_URL}/auth/login`).flush(authResponse);

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(localStorage.getItem('devcrm_token')).toBeNull();
  });
});
