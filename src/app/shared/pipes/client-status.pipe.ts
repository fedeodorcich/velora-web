import { Pipe, PipeTransform } from '@angular/core';
import { ClientStatus, clientStatusLabel } from '../../core/models/client.model';

/** Traduce el estado del cliente a su etiqueta legible en español. */
@Pipe({
  name: 'clientStatus',
  standalone: true,
})
export class ClientStatusPipe implements PipeTransform {
  transform(status: ClientStatus): string {
    return clientStatusLabel(status);
  }
}
