import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, finalize, switchMap } from 'rxjs';
import { BillingPlan, BillingService, MAX_QUOTE_LOGO_BYTES } from '../../core/services/billing.service';
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

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.run(this.billing.getPlan(), 'No pudimos consultar tu plan.');
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
        this.message.set(message ?? null);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(extractApiErrorMessage(error, fallback));
      },
    });
  }
}
