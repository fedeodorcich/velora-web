import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CLIENT_STATUS_LABELS, Client } from '../../../core/models/client.model';
import { PaginatedResult } from '../../../core/models/pagination.model';
import { ClientService } from '../../../core/services/client.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { extractApiErrorMessage, extractApiErrorReason } from '../../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationControlsComponent } from '../../../shared/components/pagination-controls/pagination-controls.component';
import { RecordListRowComponent } from '../../../shared/components/record-list-row/record-list-row.component';
import { ListSummaryCardComponent, ListSummaryMetric } from '../../../shared/components/list-summary-card/list-summary-card.component';

@Component({
    selector: 'app-client-list',
    imports: [RouterLink, EmptyStateComponent, PaginationControlsComponent, LoadingSkeletonComponent, ListSummaryCardComponent, RecordListRowComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './client-list.component.html',
    host: { '(document:keydown.escape)': 'closeMenu()' }
})
export class ClientListComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly confirm = inject(ConfirmService);

  readonly statusLabels = CLIENT_STATUS_LABELS;
  readonly openMenuId = signal<string | null>(null);
  readonly clients = signal<Client[]>([]);
  readonly allClients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly pagination = signal<PaginatedResult<Client> | null>(null);
  readonly summaryMetrics = computed<ListSummaryMetric[]>(() => {
    const clients = this.allClients();
    const currencies = new Map<string, number>();
    for (const client of clients) {
      const currency = client.currency.toUpperCase();
      currencies.set(currency, (currencies.get(currency) ?? 0) + 1);
    }
    return [
      { label: 'Clientes', value: String(clients.length), detail: 'en total' },
      { label: 'Activos', value: String(clients.filter((client) => client.status === 'activo').length) },
      ...[...currencies].map(([currency, count]) => ({
        label: `Moneda ${currency}`,
        value: String(count),
        detail: count === 1 ? 'cliente' : 'clientes',
      })),
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.closeMenu();
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      page: this.clientService.listPage({ page: this.page(), limit: this.pageSize() }),
      all: this.clientService.list(),
    }).subscribe({
      next: ({ page: result, all }) => {
        if (result.totalPages > 0 && this.page() > result.totalPages) {
          this.page.set(result.totalPages);
          this.load();
          return;
        }
        this.pagination.set(result);
        this.clients.set(result.items);
        this.allClients.set(all);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus clientes. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  toggleMenu(client: Client): void {
    this.openMenuId.update((id) => id === client.id ? null : client.id);
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  async remove(client: Client): Promise<void> {
    this.closeMenu();
    const confirmed = await this.confirm.confirm({
      title: 'Eliminar cliente',
      message: `¿Seguro que querés eliminar a «${client.name}»? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.deleteClient(client, false);
  }

  private deleteClient(client: Client, cascade: boolean): void {
    this.clientService.remove(client.id, cascade).subscribe({
      next: () => {
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409 && !cascade && extractApiErrorReason(error) === 'quotes') {
          void this.deleteWithQuotes(client);
          return;
        }
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos eliminar el cliente. Intenta nuevamente.'),
        );
      },
    });
  }

  changePage(page: number): void { this.page.set(page); this.load(); }
  changePageSize(limit: number): void { this.pageSize.set(limit); this.page.set(1); this.load(); }

  /** El cliente tiene presupuestos: ofrecemos el borrado en cascada con una segunda confirmación. */
  private async deleteWithQuotes(client: Client): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Cliente con presupuestos',
      message: `«${client.name}» tiene presupuestos asociados. Si continuás, se eliminarán también todos sus presupuestos. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar todo',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.deleteClient(client, true);
  }

}
