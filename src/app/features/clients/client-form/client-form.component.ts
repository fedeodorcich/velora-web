import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CURRENCY_OPTIONS, ClientPayload, DEFAULT_CURRENCY } from '../../../core/models/client.model';
import { ClientService } from '../../../core/services/client.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
    selector: 'app-client-form',
    imports: [ReactiveFormsModule, RouterLink, LoadingSkeletonComponent],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './client-form.component.html'
})
export class ClientFormComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly clientId = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    phone: ['', [Validators.maxLength(50)]],
    company: ['', [Validators.maxLength(160)]],
    cuilCuit: ['', [Validators.maxLength(20)]],
    currency: this.formBuilder.control<string>(DEFAULT_CURRENCY),
    notes: ['', [Validators.maxLength(2000)]],
  });

  get isEditing(): boolean {
    return this.clientId() !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientId.set(id);
      this.loadClient(id);
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload = this.buildPayload();
    const id = this.clientId();

    const request$ = id
      ? this.clientService.update(id, payload)
      : this.clientService.create(payload);

    request$.subscribe({
      next: () => {
        void this.router.navigateByUrl('/clientes');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos guardar el cliente. Intenta nuevamente.'),
        );
        this.submitting.set(false);
      },
    });
  }

  private loadClient(id: string): void {
    this.loading.set(true);
    this.clientService.get(id).subscribe({
      next: (client) => {
        this.form.patchValue({
          name: client.name,
          email: client.email,
          phone: client.phone ?? '',
          company: client.company ?? '',
          cuilCuit: client.cuilCuit ?? '',
          currency: client.currency,
          notes: client.notes ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el cliente solicitado.');
        this.loading.set(false);
      },
    });
  }

  private buildPayload(): ClientPayload {
    const raw = this.form.getRawValue();
    const payload: ClientPayload = {
      name: raw.name.trim(),
      email: raw.email.trim(),
      currency: raw.currency,
    };

    if (raw.phone.trim()) {
      payload.phone = raw.phone.trim();
    }
    if (raw.company.trim()) {
      payload.company = raw.company.trim();
    }
    if (raw.cuilCuit.trim()) {
      payload.cuilCuit = raw.cuilCuit.trim();
    }
    if (raw.notes.trim()) {
      payload.notes = raw.notes.trim();
    }

    return payload;
  }
}
