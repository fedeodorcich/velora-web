import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  Payment,
  PaymentCreatePayload,
  PaymentStatus,
  PaymentUpdatePayload,
} from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);

  private get baseUrl(): string {
    return `${API_BASE_URL}/payments`;
  }

  list(): Observable<Payment[]> {
    return this.http.get<Payment[]>(this.baseUrl);
  }

  get(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/${id}`);
  }

  create(payload: PaymentCreatePayload): Observable<Payment> {
    return this.http.post<Payment>(this.baseUrl, payload);
  }

  update(id: string, payload: PaymentUpdatePayload): Observable<Payment> {
    return this.http.patch<Payment>(`${this.baseUrl}/${id}`, payload);
  }

  updateStatus(id: string, status: PaymentStatus): Observable<Payment> {
    return this.http.patch<Payment>(`${this.baseUrl}/${id}/status`, { status });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
