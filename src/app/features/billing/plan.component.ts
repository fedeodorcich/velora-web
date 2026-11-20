import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, finalize, forkJoin, switchMap } from 'rxjs';
import { BillingPlan, BillingService, MAX_QUOTE_LOGO_BYTES, MercadoPagoTestSubscription } from '../../core/services/billing.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

@Component({
  selector: 'app-billing-plan',
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan.component.html',
})
export class PlanComponent implements OnInit {
  private readonly billing = inject(BillingService);

  readonly plan = signal<BillingPlan | null>(null);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly subscription = signal<MercadoPagoTestSubscription | null>(null);
  readonly checkingSubscription = signal(false);
  readonly subscriptionError = signal<string | null>(null);
  readonly subscriptionChecked = signal(false);
  readonly subscriptionLabels: Record<MercadoPagoTestSubscription['status'], string> = {
    pending: 'Pendiente de completar el pago',
    authorized: 'Suscripción autorizada',
    paused: 'Suscripción pausada',
    cancelled: 'Suscripción cancelada',
    canceled: 'Suscripción cancelada',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.run(this.billing.getPlan(), 'No pudimos consultar tu plan.');
  }

  checkSubscription(): void {
    if (this.checkingSubscription()) {
      return;
    }
    this.checkingSubscription.set(true);
    this.subscriptionError.set(null);
    forkJoin({
      subscription: this.billing.getMercadoPagoTestSubscription(),
      plan: this.billing.getPlan(),
    }).pipe(
      finalize(() => this.checkingSubscription.set(false)),
    ).subscribe({
      next: ({ subscription, plan }) => {
        this.plan.set(plan);
        this.subscription.set(subscription);
        this.subscriptionChecked.set(true);
      },
      error: (error: HttpErrorResponse) => {
        this.subscriptionError.set(extractApiErrorMessage(error, 'No pudimos consultar la suscripción.'));
      },
    });
  }

  openMercadoPagoTest(): void {
    if (this.pending()) {
      return;
    }

    this.error.set(null);
    this.pending.set(true);
    this.billing.createMercadoPagoTestCheckout().pipe(
      finalize(() => this.pending.set(false)),
    ).subscribe({
      next: ({ url }) => window.location.assign(url),
      error: (error: HttpErrorResponse) =>
        this.error.set(extractApiErrorMessage(error, 'No pudimos abrir el checkout de prueba.')),
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
        if (plan.mercadoPagoTestPrice) {
          this.checkSubscription();
        }
        this.message.set(message ?? null);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(extractApiErrorMessage(error, fallback));
      },
    });
  }
}
