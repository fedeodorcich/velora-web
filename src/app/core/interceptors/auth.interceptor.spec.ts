import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let logout: jasmine.Spy;
  let navigateByUrl: jasmine.Spy;
  let currentUrl: string;

  beforeEach(() => {
    logout = jasmine.createSpy('logout');
    navigateByUrl = jasmine.createSpy('navigateByUrl').and.resolveTo(true);
    currentUrl = '/clientes';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { getToken: () => 'token-1', logout } },
        {
          provide: Router,
          useValue: {
            get url(): string {
              return currentUrl;
            },
            navigateByUrl,
          },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega el token a la petición', () => {
    http.get('/api/clientes').subscribe();

    const request = httpMock.expectOne('/api/clientes');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-1');
    request.flush([]);
  });

  it('cierra la sesión y vuelve al login ante un 401', () => {
    http.get('/api/clientes').subscribe({ error: () => undefined });

    httpMock
      .expectOne('/api/clientes')
      .flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('no redirige cuando el 401 ocurre en el propio login', () => {
    currentUrl = '/login';
    http.get('/api/auth/login').subscribe({ error: () => undefined });

    httpMock
      .expectOne('/api/auth/login')
      .flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(logout).toHaveBeenCalled();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
