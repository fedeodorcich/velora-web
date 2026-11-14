import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../core/config/api.config';
import { Quote } from '../../../core/models/quote.model';
import { QuoteListComponent } from './quote-list.component';

describe('QuoteListComponent', () => {
  let component: QuoteListComponent;
  let httpMock: HttpTestingController;

  const quote: Quote = {
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
    subtotal: 100,
    taxAmount: 21,
    total: 121,
    notes: null,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteListComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(QuoteListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE_URL}/quotes?page=1&limit=12`).flush({
      items: [quote],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });
    httpMock.expectOne(`${API_BASE_URL}/quotes`).flush([quote]);
    httpMock.expectOne(`${API_BASE_URL}/projects`).flush([]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('abre y cierra el menú de acciones', () => {
    expect(component.isMenuOpen(quote)).toBeFalse();

    component.toggleMenu(quote);
    expect(component.isMenuOpen(quote)).toBeTrue();

    component.closeMenu();
    expect(component.isMenuOpen(quote)).toBeFalse();
  });

  it('cambia el estado y lo refleja en la lista', () => {
    component.changeStatus(quote, 'aceptado');

    const request = httpMock.expectOne(`${API_BASE_URL}/quotes/${quote.id}/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'aceptado' });

    request.flush({ ...quote, status: 'aceptado' });
    httpMock.expectOne(`${API_BASE_URL}/quotes?page=1&limit=12`).flush({
      items: [{ ...quote, status: 'aceptado' }],
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });
    httpMock.expectOne(`${API_BASE_URL}/quotes`).flush([{ ...quote, status: 'aceptado' }]);
    httpMock.expectOne(`${API_BASE_URL}/projects`).flush([]);
    expect(component.quotes()[0].status).toBe('aceptado');
  });

  it('no llama a la API si se elige el estado actual', () => {
    component.changeStatus(quote, 'borrador');
    httpMock.expectNone(`${API_BASE_URL}/quotes/${quote.id}/status`);
    expect(component.quotes()[0].status).toBe('borrador');
  });

  it('muestra un error si falla el cambio de estado', () => {
    component.changeStatus(quote, 'rechazado');

    httpMock
      .expectOne(`${API_BASE_URL}/quotes/${quote.id}/status`)
      .flush({ message: 'No se pudo' }, { status: 500, statusText: 'Server Error' });

    expect(component.error()).toBeTruthy();
    expect(component.quotes()[0].status).toBe('borrador');
  });

  it('bloquea el cambio de estado si el presupuesto tiene un proyecto', () => {
    component.lockedQuoteIds.set(new Set([quote.id]));

    expect(component.isLocked(quote)).toBeTrue();

    component.changeStatus(quote, 'aceptado');

    httpMock.expectNone(`${API_BASE_URL}/quotes/${quote.id}/status`);
    expect(component.error()).toBeTruthy();
    expect(component.quotes()[0].status).toBe('borrador');
  });
});
