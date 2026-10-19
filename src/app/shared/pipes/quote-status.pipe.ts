import { Pipe, PipeTransform } from '@angular/core';
import { QuoteStatus, quoteStatusLabel } from '../../core/models/quote.model';

/** Traduce el estado del presupuesto a su etiqueta legible en español. */
@Pipe({
  name: 'quoteStatus',
  standalone: true,
})
export class QuoteStatusPipe implements PipeTransform {
  transform(status: QuoteStatus): string {
    return quoteStatusLabel(status);
  }
}
