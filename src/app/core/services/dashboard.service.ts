import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

/** Resumen financiero del usuario para una moneda concreta. */
export interface DashboardFinancial {
  currency: string;
  collectedThisMonth: number;
  pendingTotal: number;
  overdueTotal: number;
  overdueCount: number;
}

export interface DashboardMetrics {
  activeProjectsCount: number;
  pendingQuotesCount: number;
  totalClientsCount: number;
}

export interface UpcomingPaymentItem {
  id: string;
  number: number;
  concept: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pendiente' | 'pagado';
  isOverdue: boolean;
  projectName: string;
  clientName: string;
}

export interface RecentProjectItem {
  id: string;
  code: string;
  name: string;
  clientName: string;
  status: string;
  budget: number;
  collectedAmount: number;
  currency: string;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  financials: DashboardFinancial[];
  upcomingPayments: UpcomingPaymentItem[];
  recentProjects: RecentProjectItem[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${API_BASE_URL}/dashboard/summary`);
  }
}
