import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { QuotePayload } from '../models/quote.model';
import { QuoteService } from './quote.service';

describe('QuoteService', () => {
  let service: QuoteService;
  let httpMock: HttpTestingController;

  const payload: QuotePayload = {
    clientId: 'client-1',
    title: 'Rediseño de landing',
    currency: 'USD',
    issueDate: '2026-10-15',
    status: 'borrador',
    taxRate: 21,
    items: [{ description: 'Diseño de interfaz', quantity: 2, unitPrice: 100 }],
  };

  const quoteResponse = {
    id: 'quote-1',
    userId: 'user-1',
    clientId: 'client-1',
    number: 1,
    title: 'Rediseño de landing',
    status: 'borrador',
    currency: 'USD',
    issueDate: '2026-10-15',
    validUntil: null,
    taxRate: 21,
    subtotal: 200,
    taxAmount: 42,
    total: 242,
    notes: null,
    items: [],
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QuoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los presupuestos con GET', () => {
    let result: unknown;
    service.list().subscribe((quotes) => (result = quotes));

    const request = httpMock.expectOne(`${API_BASE_URL}/quotes`);
    expect(request.request.method).toBe('GET');
    request.flush([quoteResponse]);

    expect(result).toEqual([quoteResponse]);
  });

  it('crea un presupuesto con POST', () => {
    service.create(payload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/quotes`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(quoteResponse);
  });

  it('actualiza un presupuesto con PATCH', () => {
    service.update('quote-1', payload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/quotes/quote-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(payload);
    request.flush(quoteResponse);
  });

  it('cambia el estado con PATCH a /status', () => {
    service.updateStatus('quote-1', 'aceptado').subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/quotes/quote-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'aceptado' });
    request.flush({ ...quoteResponse, status: 'aceptado' });
  });

  it('elimina un presupuesto con DELETE', () => {
    service.remove('quote-1').subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/quotes/quote-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
