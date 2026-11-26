import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../config/api.config';
export interface CommunityConfig { supportEmail: string | null; contactEnabled: boolean; donationUrl: string | null; donationTestEnabled: boolean; donationAmounts: number[]; currency: string; }
export interface ContactPayload { name: string; email: string; subject: string; message: string; privacyAccepted: boolean; website: string; }
@Injectable({providedIn:'root'})
export class CommunityService {
  private readonly http = inject(HttpClient);
  advertising() { return this.http.get<{adFree:boolean;adFreeSince:string|null}>(API_BASE_URL+'/community/advertising'); }
  config() { return this.http.get<CommunityConfig>(API_BASE_URL + '/community/config'); }
  contact(payload: ContactPayload) { return this.http.post<{id:string;message:string;notificationSent:boolean}>(API_BASE_URL + '/community/contact',payload); }
  testDonation(amount: number) { return this.http.post<{url:string}>(API_BASE_URL + '/community/donations/test-checkout',{amount}); }
}
