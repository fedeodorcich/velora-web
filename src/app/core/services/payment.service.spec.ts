import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { PaymentCreatePayload, PaymentUpdatePayload } from '../models/payment.model';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  const createPayload: PaymentCreatePayload = {
    projectId: 'project-1',
    concept: 'Anticipo',
    amount: 250,
    dueDate: '2026-11-01',
  };

  const updatePayload: PaymentUpdatePayload = {
    concept: 'Anticipo',
    amount: 300,
    dueDate: '2026-11-15',
  };

  const paymentResponse = {
    id: 'payment-1',
    userId: 'user-1',
    projectId: 'project-1',
    number: 1,
    concept: 'Anticipo',
    amount: 250,
    currency: 'USD',
    dueDate: '2026-11-01',
    status: 'pendiente',
    paidAt: null,
    method: null,
    notes: null,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lista los cobros con GET', () => {
    let result: unknown;
    service.list().subscribe((payments) => (result = payments));

    const request = httpMock.expectOne(`${API_BASE_URL}/payments`);
    expect(request.request.method).toBe('GET');
    request.flush([paymentResponse]);

    expect(result).toEqual([paymentResponse]);
  });

  it('crea un cobro con POST', () => {
    service.create(createPayload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/payments`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(createPayload);
    request.flush(paymentResponse);
  });

  it('actualiza un cobro con PATCH', () => {
    service.update('payment-1', updatePayload).subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/payments/payment-1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(updatePayload);
    request.flush(paymentResponse);
  });

  it('cambia el estado con PATCH a /status', () => {
    service.updateStatus('payment-1', 'pagado').subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/payments/payment-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'pagado' });
    request.flush({ ...paymentResponse, status: 'pagado' });
  });

  it('elimina un cobro con DELETE', () => {
    service.remove('payment-1').subscribe();

    const request = httpMock.expectOne(`${API_BASE_URL}/payments/payment-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
