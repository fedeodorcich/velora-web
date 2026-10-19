import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { ProjectCreatePayload, ProjectUpdatePayload } from '../models/project.model';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  const createPayload: ProjectCreatePayload = {
    quoteId: 'quote-1',
    progress: 25,
  };

  const updatePayload: ProjectUpdatePayload = {
    name: 'Rediseño de landing',
    currency: 'USD',
    budget: 500,
    progress: 25,
  };

  const projectResponse = {
    id: 'project-1',
    userId: 'user-1',
    clientId: 'client-1',
    quoteId: null,
    number: 1,
    name: 'Rediseño de landing',
    status: 'planificado',
    currency: 'USD',
    budget: 500,
    progress: 25,
    startDate: null,
    dueDate: null,
    description: null,
    notes: null,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los proyectos con GET', () => {
    let result: unknown;
    service.list().subscribe((projects) => (result = projects));

    const request = httpMock.expectOne(`${API_BASE_URL}/projects`);
    expect(request.request.method).toBe('GET');
    request.flush([projectResponse]);

    expect(result).toEqual([projectResponse]);
  });

  it('crea un proyecto con POST', () => {
    service.create(createPayload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/projects`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(createPayload);
    request.flush(projectResponse);
  });

  it('actualiza un proyecto con PATCH', () => {
    service.update('project-1', updatePayload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/projects/project-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(updatePayload);
    request.flush(projectResponse);
  });

  it('cambia el estado con PATCH a /status', () => {
    service.updateStatus('project-1', 'en_progreso').subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/projects/project-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'en_progreso' });
    request.flush({ ...projectResponse, status: 'en_progreso' });
  });

  it('elimina un proyecto con DELETE', () => {
    service.remove('project-1').subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/projects/project-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
