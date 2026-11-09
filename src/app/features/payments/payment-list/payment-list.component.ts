import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  PAYMENT_DISPLAY_OPTIONS,
  Payment,
  PaymentDisplayStatus,
  PaymentStatus,
  formatPaymentNumber,
  paymentDisplayStatus,
  paymentStatusClass,
  paymentTotalsByCurrency,
} from '../../../core/models/payment.model';
import { PaginatedResult } from '../../../core/models/pagination.model';
import { formatProjectNumber } from '../../../core/models/project.model';
import { formatAmount } from '../../../core/models/quote.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { PaymentService } from '../../../core/services/payment.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationControlsComponent } from '../../../shared/components/pagination-controls/pagination-controls.component';
import { RecordListRowComponent } from '../../../shared/components/record-list-row/record-list-row.component';
import { ListSummaryCardComponent, ListSummaryMetric } from '../../../shared/components/list-summary-card/list-summary-card.component';
import { PaymentStatusPipe } from '../../../shared/pipes/payment-status.pipe';
import { ShortDatePipe } from '../../../shared/pipes/short-date.pipe';

type PaymentFilter = PaymentDisplayStatus | 'todos';

@Component({
  selector: 'app-payment-list',
  imports: [RouterLink, EmptyStateComponent, PaymentStatusPipe, ShortDatePipe, PaginationControlsComponent, LoadingSkeletonComponent, RecordListRowComponent, ListSummaryCardComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './payment-list.component.html',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class PaymentListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly confirm = inject(ConfirmService);

  readonly displayOptions = PAYMENT_DISPLAY_OPTIONS;

  readonly payments = signal<Payment[]>([]);
  readonly allPayments = signal<Payment[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly pagination = signal<PaginatedResult<Payment> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<PaymentFilter>('todos');
  /** Id del cobro cuyo menú de acciones está abierto (solo uno a la vez). */
  readonly openMenuId = signal<string | null>(null);
  /** Id del cobro con una actualización de estado en curso. */
  readonly updatingId = signal<string | null>(null);

  readonly totals = computed(() => paymentTotalsByCurrency(this.allPayments()));

  readonly summaryMetrics = computed<ListSummaryMetric[]>(() => {
    const payments = this.allPayments();
    return [
      { label: 'Cobros', value: String(payments.length), detail: 'en total' },
      ...this.totals().flatMap((total) => {
        const overdue = payments.filter((payment) => payment.currency.toUpperCase() === total.currency && paymentDisplayStatus(payment) === 'vencido');
        return [
          { label: `Cobrado ${total.currency}`, value: this.totalAmount(total.paid, total.currency) },
          { label: `Pendiente ${total.currency}`, value: this.totalAmount(total.pending, total.currency) },
          { label: `Vencido ${total.currency}`, value: this.totalAmount(overdue.reduce((sum, payment) => sum + payment.amount, 0), total.currency), detail: `${overdue.length} ${overdue.length === 1 ? 'cobro' : 'cobros'}` },
        ];
      }),
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      page: this.paymentService.listPage({ page: this.page(), limit: this.pageSize(), status: this.filter() === 'todos' ? undefined : this.filter() }),
      all: this.paymentService.list(),
    }).subscribe({
      next: ({ page: result, all }) => {
        if (result.totalPages > 0 && this.page() > result.totalPages) { this.page.set(result.totalPages); this.load(); return; }
        this.pagination.set(result);
        this.payments.set(result.items);
        this.allPayments.set(all);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus cobros. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  setFilter(value: PaymentFilter): void { this.filter.set(value); this.page.set(1); this.load(); }
  changePage(page: number): void { this.page.set(page); this.load(); }
  changePageSize(limit: number): void { this.pageSize.set(limit); this.page.set(1); this.load(); }

  async remove(payment: Payment): Promise<void> {
    this.closeMenu();

    const confirmed = await this.confirm.confirm({
      title: 'Eliminar cobro',
      message: `¿Seguro que querés eliminar el cobro ${this.number(payment)}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.paymentService.remove(payment.id).subscribe({
      next: () => {
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos eliminar el cobro. Intenta nuevamente.'),
        );
      },
    });
  }

  toggleStatus(payment: Payment): void {
    if (this.updatingId() === payment.id) {
      return;
    }

    const next: PaymentStatus = payment.status === 'pagado' ? 'pendiente' : 'pagado';
    this.updatingId.set(payment.id);
    this.error.set(null);

    this.paymentService.updateStatus(payment.id, next).subscribe({
      next: (updated) => {
        this.load();
        this.updatingId.set(null);
        this.closeMenu();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos cambiar el estado del cobro.'),
        );
        this.updatingId.set(null);
        this.closeMenu();
      },
    });
  }

  number(payment: Payment): string {
    return formatPaymentNumber(payment.number);
  }

  amount(payment: Payment): string {
    return formatAmount(payment.amount, payment.currency);
  }

  totalAmount(value: number, currency: string): string {
    return formatAmount(value, currency);
  }

  clientName(payment: Payment): string {
    const client = payment.project?.client;
    if (!client) {
      return 'Cliente no disponible';
    }
    return client.company ?? client.name;
  }

  projectLabel(payment: Payment): string {
    const project = payment.project;
    if (!project) {
      return 'Proyecto no disponible';
    }
    return `${formatProjectNumber(project.number)} ${project.name}`;
  }

  isPaid(payment: Payment): boolean {
    return payment.status === 'pagado';
  }

  statusClass(payment: Payment): string {
    return paymentStatusClass(payment);
  }

  isMenuOpen(payment: Payment): boolean {
    return this.openMenuId() === payment.id;
  }

  toggleMenu(payment: Payment): void {
    this.openMenuId.update((current) => (current === payment.id ? null : payment.id));
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  filterChipClass(value: PaymentFilter): string {
    return this.filter() === value
      ? 'border-accent bg-accent text-ground'
      : 'border-rule text-ink-3 hover:border-rule-strong hover:text-ink';
  }
}
