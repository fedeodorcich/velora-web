import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Client, ClientStatus } from '../../../core/models/client.model';
import { ClientService } from '../../../core/services/client.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { extractApiErrorMessage, extractApiErrorReason } from '../../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ClientStatusPipe } from '../../../shared/pipes/client-status.pipe';

@Component({
    selector: 'app-client-list',
    imports: [RouterLink, EmptyStateComponent, ClientStatusPipe],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './client-list.component.html'
})
export class ClientListComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly confirm = inject(ConfirmService);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.clientService.list().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus clientes. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  async remove(client: Client): Promise<void> {
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
        this.clients.update((list) => list.filter((item) => item.id !== client.id));
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

  statusClass(status: ClientStatus): string {
    switch (status) {
      case 'activo':
        return 'border-ok/50 text-ok';
      case 'inactivo':
        return 'border-rule-strong text-ink-3';
      default:
        return 'border-amber/50 text-amber';
    }
  }
}
