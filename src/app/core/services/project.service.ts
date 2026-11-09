import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  Project,
  ProjectCreatePayload,
  ProjectStatus,
  ProjectUpdatePayload,
} from '../models/project.model';
import { PageRequest, PaginatedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${API_BASE_URL}/projects`;
  }

  list(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl);
  }

  listPage(request: PageRequest): Observable<PaginatedResult<Project>> {
    const params: Record<string, string | number> = { page: request.page, limit: request.limit };
    if (request.status) params['status'] = request.status;
    return this.http.get<PaginatedResult<Project>>(this.baseUrl, { params });
  }

  get(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`);
  }

  create(payload: ProjectCreatePayload): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, payload);
  }

  update(id: string, payload: ProjectUpdatePayload): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: ProjectStatus): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}/status`, { status });
  }

  remove(id: string, cascade = false): Observable<void> {
    const suffix = cascade ? '?cascade=true' : '';
    return this.http.delete<void>(`${this.baseUrl}/${id}${suffix}`);
  }
}
