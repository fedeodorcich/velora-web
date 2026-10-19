import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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
import { formatProjectNumber } from '../../../core/models/project.model';
import { formatAmount } from '../../../core/models/quote.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { PaymentService } from '../../../core/services/payment.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaymentStatusPipe } from '../../../shared/pipes/payment-status.pipe';

type PaymentFilter = PaymentDisplayStatus | 'todos';

@Component({
  selector: 'app-payment-list',
  imports: [RouterLink, EmptyStateComponent, PaymentStatusPipe],
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
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly filter = signal<PaymentFilter>('todos');
  /** Id del cobro cuyo menú de acciones está abierto (solo uno a la vez). */
  readonly openMenuId = signal<string | null>(null);
  /** Id del cobro con una actualización de estado en curso. */
  readonly updatingId = signal<string | null>(null);

  readonly visiblePayments = computed(() => {
    const filter = this.filter();
    const all = this.payments();
    if (filter === 'todos') {
      return all;
    }
    return all.filter((payment) => paymentDisplayStatus(payment) === filter);
  });

  readonly totals = computed(() => paymentTotalsByCurrency(this.payments()));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.paymentService.list().subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus cobros. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

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
        this.payments.update((list) => list.filter((item) => item.id !== payment.id));
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
        this.payments.update((list) =>
          list.map((item) =>
            item.id === payment.id ? { ...item, status: updated.status, paidAt: updated.paidAt } : item,
          ),
        );
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
    return `${formatProjectNumber(project.number)} · ${project.name}`;
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
    return this.filter() === value ? 'bg-cobalt text-white' : 'bg-subtle text-ink/60';
  }
}
