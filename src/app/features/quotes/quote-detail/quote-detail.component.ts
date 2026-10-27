import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  Quote,
  QuoteItem,
  formatAmount,
  formatQuoteNumber,
  quoteStatusClass,
  quoteStatusLabel,
} from '../../../core/models/quote.model';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { QuoteService } from '../../../core/services/quote.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { ShortDatePipe } from '../../../shared/pipes/short-date.pipe';

@Component({
  selector: 'app-quote-detail',
  imports: [RouterLink, ShortDatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './quote-detail.component.html',
})
export class QuoteDetailComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly auth = inject(AuthService);

  readonly quote = signal<Quote | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  /** Usuario logueado: es quien emite el presupuesto. */
  readonly issuer = this.auth.user;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    } else {
      this.error.set('Presupuesto no encontrado.');
      this.loading.set(false);
    }
  }

  number(): string {
    const quote = this.quote();
    return quote ? formatQuoteNumber(quote.number) : '';
  }

  amount(value: number): string {
    const quote = this.quote();
    return quote ? formatAmount(value, quote.currency) : '';
  }

  lineAmount(item: QuoteItem): string {
    return this.amount(item.quantity * item.unitPrice);
  }

  statusClass(): string {
    const quote = this.quote();
    return quote ? quoteStatusClass(quote.status) : '';
  }

  statusLabel(): string {
    const quote = this.quote();
    return quote ? quoteStatusLabel(quote.status) : '';
  }

  print(): void {
    window.print();
  }

  async remove(): Promise<void> {
    const quote = this.quote();
    if (!quote) {
      return;
    }

    const confirmed = await this.confirm.confirm({
      title: 'Eliminar presupuesto',
      message: `¿Seguro que querés eliminar el presupuesto ${this.number()}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.quoteService.remove(quote.id).subscribe({
      next: () => {
        void this.router.navigateByUrl('/presupuestos');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos eliminar el presupuesto. Intenta nuevamente.'),
        );
      },
    });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.quoteService.get(id).subscribe({
      next: (quote) => {
        this.quote.set(quote);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el presupuesto solicitado.');
        this.loading.set(false);
      },
    });
  }
}
