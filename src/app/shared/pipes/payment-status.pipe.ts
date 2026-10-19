import { Pipe, PipeTransform } from '@angular/core';
import { Payment, paymentDisplayLabel } from '../../core/models/payment.model';

/** Traduce el estado visible del cobro (pendiente / vencido / pagado) a español. */
@Pipe({
  name: 'paymentStatus',
  standalone: true,
})
export class PaymentStatusPipe implements PipeTransform {
  transform(payment: Payment): string {
    return paymentDisplayLabel(payment);
  }
}
