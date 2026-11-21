import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';

export const MAX_QUOTE_LOGO_BYTES = 64 * 1024;

export interface MercadoPagoTestSubscription {
  status: 'pending' | 'authorized' | 'paused' | 'cancelled' | 'canceled';
  amount: number;
  currency: string;
  chargedQuantity: number;
}

export interface ProPurchase {
  id: string; amount: number; currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'expired';
  validUntil: string | null;
}

export interface BillingPlan {
  oneTimeOffer?: { amount: number; currency: string; months: number; test: boolean } | null;
  plan: 'free' | 'pro';
  proUntil: string | null;
  quoteLogo: string | null;
  interestRegistered: boolean;
  checkout: { url: string; price: string } | null;
  activeClientLimit: number | null;
  mercadoPagoTestPrice: number | null;
  automaticBilling?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/billing`;

  getPlan() {
    return this.http.get<BillingPlan>(this.url);
  }

  getMercadoPagoTestSubscription() {
    return this.http.get<MercadoPagoTestSubscription | null>(`${this.url}/mercado-pago/test-subscription`);
  }

  createMercadoPagoTestCheckout() {
    return this.http.post<{ url: string }>(`${this.url}/mercado-pago/test-checkout`, null);
  }

  createPurchase() { return this.http.post<{ id: string; url: string }>(`${this.url}/mercado-pago/purchases`, null); }
  latestPurchase() { return this.http.get<ProPurchase | null>(`${this.url}/mercado-pago/purchases/latest`); }
  refreshPurchase(id: string, paymentId?: string) {
    return this.http.post<ProPurchase>(`${this.url}/mercado-pago/purchases/${id}/refresh`, paymentId ? { paymentId } : {});
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
