import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { Quote, QuotePayload, QuoteStatus } from '../models/quote.model';
import { PageRequest, PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${API_BASE_URL}/quotes`;
  }

  list(): Observable<Quote[]> {
    return this.http.get<Quote[]>(this.baseUrl);
  }

  listPage(request: PageRequest): Observable<PaginatedResult<Quote>> {
    const params: Record<string, string | number> = { page: request.page, limit: request.limit };
    if (request.status) params['status'] = request.status;
    return this.http.get<PaginatedResult<Quote>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Quote> {
    return this.http.get<Quote>(`${this.baseUrl}/${id}`);
  }

  create(payload: QuotePayload): Observable<Quote> {
    return this.http.post<Quote>(this.baseUrl, payload);
  }

  update(id: string, payload: QuotePayload): Observable<Quote> {
    return this.http.patch<Quote>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: QuoteStatus): Observable<Quote> {
    return this.http.patch<Quote>(`${this.baseUrl}/${id}/status`, { status });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
