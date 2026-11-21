import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, finalize, switchMap } from 'rxjs';
import { BillingPlan, BillingService, MAX_QUOTE_LOGO_BYTES, ProPurchase } from '../../core/services/billing.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-billing-plan',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan.component.html',
})
export class PlanComponent implements OnInit {
  private readonly billing = inject(BillingService);
  private readonly route = inject(ActivatedRoute);

  readonly plan = signal<BillingPlan | null>(null);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly purchase = signal<ProPurchase | null>(null);
  readonly purchaseLabels: Record<ProPurchase['status'], string> = {
    pending: 'Pago pendiente de confirmación. Si ya pagaste, esperá unos instantes y actualizá el estado.',
    approved: 'Pago aprobado. Tu mes de Pro está confirmado.',
    rejected: 'El pago no se completó. Podés volver a intentarlo.',
    refunded: 'El pago fue devuelto o revertido. Se actualizó la vigencia de Pro.',
    expired: 'El enlace de pago venció. Podés iniciar una nueva compra.',
  };

  ngOnInit(): void { this.load(); }

  load(): void {
    const query = this.route.snapshot.queryParamMap;
    const id = query.get('purchase');
    const paymentId = query.get('payment_id') ?? query.get('collection_id');
    if (id && /^[a-f0-9-]{36}$/i.test(id) && paymentId && /^\d{1,32}$/.test(paymentId)) {
      this.run(this.billing.refreshPurchase(id, paymentId).pipe(switchMap(() => this.billing.getPlan())), 'No pudimos confirmar el pago. Actualizá el estado en unos instantes.');
    } else { this.run(this.billing.getPlan(), 'No pudimos consultar tu plan.'); }
  }


  openPurchase(): void {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.billing.createPurchase().pipe(finalize(() => this.pending.set(false))).subscribe({
      next: ({ url }) => window.location.assign(url),
      error: (error: HttpErrorResponse) => this.error.set(extractApiErrorMessage(error, 'No pudimos abrir Mercado Pago. Volvé a intentarlo.')),
    });
  }

  registerInterest(): void {
    this.run(
      this.billing.registerInterest().pipe(switchMap(() => this.billing.getPlan())),
      'No pudimos registrar tu interés.',
      'Registramos tu interés en el piloto Pro.',
    );
  }

  uploadLogo(input: HTMLInputElement): void {
    const file = input.files?.item(0);
    input.value = '';
    if (!file || this.pending()) {
      return;
    }

    this.message.set(null);
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > MAX_QUOTE_LOGO_BYTES) {
      this.error.set('Elegí una imagen PNG o JPEG de hasta 64 KiB.');
      return;
    }

    this.error.set(null);
    this.pending.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      this.pending.set(false);
      if (typeof reader.result === 'string') {
        this.run(
          this.billing.updateQuoteLogo(reader.result).pipe(switchMap(() => this.billing.getPlan())),
          'No pudimos guardar el logo.',
          'Logo actualizado.',
        );
      }
    };
    reader.onerror = () => {
      this.pending.set(false);
      this.error.set('No pudimos leer la imagen.');
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.run(
      this.billing.removeQuoteLogo().pipe(switchMap(() => this.billing.getPlan())),
      'No pudimos quitar el logo.',
      'Logo eliminado.',
    );
  }

  private run(request: Observable<BillingPlan>, fallback: string, message?: string): void {
    if (this.pending()) {
      return;
    }

    this.pending.set(true);
    this.error.set(null);
    this.message.set(null);
    request.pipe(finalize(() => this.pending.set(false))).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.billing.latestPurchase().subscribe({
          next: (purchase) => this.purchase.set(purchase),
          error: () => this.error.set('No pudimos consultar tu último pago. Podés actualizar el estado para reintentar.'),
        });
        this.message.set(message ?? null);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(extractApiErrorMessage(error, fallback));
      },
    });
  }
}
