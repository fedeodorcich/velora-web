import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';

export const MAX_QUOTE_LOGO_BYTES = 64 * 1024;

export interface BillingPlan {
  plan: 'free' | 'pro';
  proUntil: string | null;
  quoteLogo: string | null;
  interestRegistered: boolean;
  checkout: { url: string; price: string } | null;
  activeClientLimit: number | null;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/billing`;

  getPlan() {
    return this.http.get<BillingPlan>(this.url);
  }

  registerInterest() {
    return this.http.post<void>(`${this.url}/interest`, null);
  }

  updateQuoteLogo(dataUrl: string) {
    return this.http.put<void>(`${this.url}/quote-logo`, { dataUrl });
  }

  removeQuoteLogo() {
    return this.http.delete<void>(`${this.url}/quote-logo`);
  }
}
