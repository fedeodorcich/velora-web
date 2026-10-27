import { Pipe, PipeTransform } from '@angular/core';

import { formatShortDate } from '../../core/utils/format-date.util';

/** Fecha legible para tablas y fichas: `1 oct 2026`. */
@Pipe({
  name: 'shortDate',
})
export class ShortDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return formatShortDate(value);
  }
}
