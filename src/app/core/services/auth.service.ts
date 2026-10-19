import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { AuthResponse, LoginPayload, RegisterPayload } from '../models/auth.model';
import { User } from '../models/user.model';

const TOKEN_KEY = 'devcrm_token';
const USER_KEY = 'devcrm_user';

/**
 * Gestiona la sesión del freelancer: registro, login, logout y persistencia local.
 * El estado se expone mediante Signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(this.readStoredToken());
  private readonly _user = signal<User | null>(this.readStoredUser());

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/register`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return this._token();
  }

  private persistSession(response: AuthResponse): void {
    this._token.set(response.accessToken);
    this._user.set(response.user);
    localStorage.setItem(TOKEN_KEY, response.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  private readStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
