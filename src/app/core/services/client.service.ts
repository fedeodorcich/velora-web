import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Client, ClientPayload } from '../models/client.model';
import { PageRequest, PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${API_BASE_URL}/clients`;
  }

  list(): Observable<Client[]> {
    return this.http.get<Client[]>(this.baseUrl);
  }

  listPage(request: PageRequest): Observable<PaginatedResult<Client>> {
    return this.http.get<PaginatedResult<Client>>(this.baseUrl, {
      params: { page: request.page, limit: request.limit },
    });
  }

  get(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.baseUrl}/${id}`);
  }

  create(payload: ClientPayload): Observable<Client> {
    return this.http.post<Client>(this.baseUrl, payload);
  }

  update(id: string, payload: ClientPayload): Observable<Client> {
    return this.http.patch<Client>(`${this.baseUrl}/${id}`, payload);
  }

  remove(id: string, cascade = false): Observable<void> {
    const suffix = cascade ? '?cascade=true' : '';
    return this.http.delete<void>(`${this.baseUrl}/${id}${suffix}`);
  }
}
