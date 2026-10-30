import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { formatPaymentNumber } from '../../core/models/payment.model';
import { formatAmount } from '../../core/models/quote.model';
import {
  DashboardService,
  DashboardSummary,
  RecentProjectItem,
  UpcomingPaymentItem,
} from '../../core/services/dashboard.service';
import { PaymentService } from '../../core/services/payment.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ShortDatePipe } from '../../shared/pipes/short-date.pipe';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, ShortDatePipe, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly paymentService = inject(PaymentService);

  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  /** Id del cobro con una actualización de estado en curso. */
  readonly updatingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);

    this.dashboardService.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el panel. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  markAsPaid(payment: UpcomingPaymentItem): void {
    if (this.updatingId() === payment.id) {
      return;
    }

    this.updatingId.set(payment.id);
    this.error.set(null);

    this.paymentService.updateStatus(payment.id, 'pagado').subscribe({
      next: () => {
        this.updatingId.set(null);
        this.loadSummary();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos registrar el cobro como pagado.'),
        );
        this.updatingId.set(null);
      },
    });
  }

  amount(value: number, currency: string): string {
    return formatAmount(value, currency);
  }

  /** Sin ningún dato todavía: se ofrece el estado vacío con CTA. */
  isEmpty(): boolean {
    const summary = this.summary();
    return (
      !!summary &&
      summary.financials.length === 0 &&
      summary.upcomingPayments.length === 0 &&
      summary.recentProjects.length === 0 &&
      summary.metrics.totalClientsCount === 0 &&
      summary.metrics.pendingQuotesCount === 0 &&
      summary.metrics.activeProjectsCount === 0
    );
  }

  paymentNumber(payment: UpcomingPaymentItem): string {
    return formatPaymentNumber(payment.number);
  }

  /** Porcentaje cobrado del presupuesto del proyecto (acotado a 100). */
  collectedPercent(project: RecentProjectItem): number {
    if (project.budget <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((project.collectedAmount / project.budget) * 100));
  }

  clientLabel(payment: UpcomingPaymentItem): string {
    return payment.clientName || 'Cliente no disponible';
  }

  projectLabel(payment: UpcomingPaymentItem): string {
    return payment.projectName || 'Proyecto no disponible';
  }
}
