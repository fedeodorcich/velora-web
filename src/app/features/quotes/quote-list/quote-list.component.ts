import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import {
  QUOTE_STATUS_OPTIONS,
  Quote,
  QuoteStatus,
  formatAmount,
  formatQuoteNumber,
  quoteStatusClass,
} from '../../../core/models/quote.model';
import { PaginatedResult } from '../../../core/models/pagination.model';
import { Project } from '../../../core/models/project.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ProjectService } from '../../../core/services/project.service';
import { QuoteService } from '../../../core/services/quote.service';
import { CurrencyTotal, totalsByCurrency } from '../../../core/utils/currency-total.util';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationControlsComponent } from '../../../shared/components/pagination-controls/pagination-controls.component';
import { RecordListRowComponent } from '../../../shared/components/record-list-row/record-list-row.component';
import { ListSummaryCardComponent, ListSummaryMetric } from '../../../shared/components/list-summary-card/list-summary-card.component';
import { QuoteStatusPipe } from '../../../shared/pipes/quote-status.pipe';
import { ShortDatePipe } from '../../../shared/pipes/short-date.pipe';

type QuoteStatusFilter = QuoteStatus | 'todos';

@Component({
  selector: 'app-quote-list',
  imports: [RouterLink, EmptyStateComponent, QuoteStatusPipe, ShortDatePipe, PaginationControlsComponent, LoadingSkeletonComponent, RecordListRowComponent, ListSummaryCardComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './quote-list.component.html',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class QuoteListComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly projectService = inject(ProjectService);
  private readonly confirm = inject(ConfirmService);

  readonly statusOptions = QUOTE_STATUS_OPTIONS;

  readonly quotes = signal<Quote[]>([]);
  readonly allQuotes = signal<Quote[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly pagination = signal<PaginatedResult<Quote> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<QuoteStatusFilter>('todos');
  /** Ids de presupuestos que ya tienen proyecto (no cambian de estado ni se eliminan). */
  readonly lockedQuoteIds = signal<ReadonlySet<string>>(new Set());
  /** Id del presupuesto cuyo menú de acciones está abierto (solo uno a la vez). */
  readonly openMenuId = signal<string | null>(null);
  /** Id del presupuesto con una actualización de estado en curso. */
  readonly updatingId = signal<string | null>(null);

  readonly visibleQuotes = computed(() => {
    const filter = this.statusFilter();
    const all = this.quotes();
    return filter === 'todos' ? all : all.filter((quote) => quote.status === filter);
  });

  /** Resumen general agrupado por moneda; no cambia al filtrar la lista. */
  readonly totals = computed(() =>
    totalsByCurrency(
      this.allQuotes(),
      (quote) => quote.currency,
      (quote) => quote.total,
    ),
  );

  readonly summaryMetrics = computed<ListSummaryMetric[]>(() => {
    const quotes = this.allQuotes();
    return [
      { label: 'Presupuestos', value: String(quotes.length), detail: 'en total' },
      { label: 'Enviados', value: String(quotes.filter((quote) => quote.status === 'enviado').length), detail: 'esperando respuesta' },
      { label: 'Aceptados', value: String(quotes.filter((quote) => quote.status === 'aceptado').length) },
      ...this.totals().map((total) => ({ label: `Total ${total.currency}`, value: this.totalAmount(total) })),
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      quotes: this.quoteService.listPage({ page: this.page(), limit: this.pageSize(), status: this.statusFilter() === 'todos' ? undefined : this.statusFilter() }),
      allQuotes: this.quoteService.list(),
      projects: this.projectService.list().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ quotes, allQuotes, projects }) => {
        if (quotes.totalPages > 0 && this.page() > quotes.totalPages) {
          this.page.set(quotes.totalPages);
          this.load();
          return;
        }
        this.pagination.set(quotes);
        this.quotes.set(quotes.items);
        this.allQuotes.set(allQuotes);
        this.lockedQuoteIds.set(this.buildLockedQuoteIds(projects));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus presupuestos. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(value: QuoteStatusFilter): void { this.statusFilter.set(value); this.page.set(1); this.load(); }
  changePage(page: number): void { this.page.set(page); this.load(); }
  changePageSize(limit: number): void { this.pageSize.set(limit); this.page.set(1); this.load(); }

  async remove(quote: Quote): Promise<void> {
    this.closeMenu();

    if (this.isLocked(quote)) {
      this.error.set('No puedes eliminar un presupuesto que ya tiene un proyecto asociado.');
      return;
    }

    const confirmed = await this.confirm.confirm({
      title: 'Eliminar presupuesto',
      message: `¿Seguro que querés eliminar el presupuesto ${this.number(quote)}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.quoteService.remove(quote.id).subscribe({
      next: () => {
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos eliminar el presupuesto. Intenta nuevamente.'),
        );
      },
    });
  }

  number(quote: Quote): string {
    return formatQuoteNumber(quote.number);
  }

  isMenuOpen(quote: Quote): boolean {
    return this.openMenuId() === quote.id;
  }

  isLocked(quote: Quote): boolean {
    return this.lockedQuoteIds().has(quote.id);
  }

  toggleMenu(quote: Quote): void {
    this.openMenuId.update((current) => (current === quote.id ? null : quote.id));
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  changeStatus(quote: Quote, status: QuoteStatus): void {
    if (this.isLocked(quote)) {
      this.closeMenu();
      this.error.set('No puedes cambiar el estado de un presupuesto que ya tiene un proyecto.');
      return;
    }

    if (quote.status === status || this.updatingId() === quote.id) {
      this.closeMenu();
      return;
    }

    this.updatingId.set(quote.id);
    this.error.set(null);

    this.quoteService.updateStatus(quote.id, status).subscribe({
      next: (updated) => {
        this.load();
        this.updatingId.set(null);
        this.closeMenu();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos cambiar el estado del presupuesto.'),
        );
        this.updatingId.set(null);
        this.closeMenu();
      },
    });
  }

  amount(quote: Quote): string {
    return formatAmount(quote.total, quote.currency);
  }

  totalAmount(entry: CurrencyTotal): string {
    return formatAmount(entry.total, entry.currency);
  }

  statusClass(quote: Quote): string {
    return quoteStatusClass(quote.status);
  }

  filterChipClass(value: QuoteStatusFilter): string {
    return this.statusFilter() === value
      ? 'border-accent bg-accent text-ground'
      : 'border-rule text-ink-3 hover:border-rule-strong hover:text-ink';
  }

  private buildLockedQuoteIds(projects: Project[]): ReadonlySet<string> {
    return new Set(
      projects.map((project) => project.quoteId).filter((id): id is string => id !== null),
    );
  }
}
