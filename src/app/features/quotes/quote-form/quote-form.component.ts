import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

import { CURRENCY_OPTIONS, Client, DEFAULT_CURRENCY } from '../../../core/models/client.model';
import {
  Quote,
  QuotePayload,
  formatAmount,
  formatQuoteNumber,
} from '../../../core/models/quote.model';
import { ClientService } from '../../../core/services/client.service';
import { QuoteService } from '../../../core/services/quote.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

interface QuoteItemForm {
  description: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
}

interface QuoteTotals {
  subtotal: number;
  taxAmount: number;
  total: number;
}

@Component({
  selector: 'app-quote-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './quote-form.component.html',
})
export class QuoteFormComponent implements OnInit {
  private readonly quoteService = inject(QuoteService);
  private readonly clientService = inject(ClientService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly currencyOptions = CURRENCY_OPTIONS;

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(false);
  readonly dependenciesLoading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly quoteId = signal<string | null>(null);
  /** Presupuesto recién creado: si tiene valor, se muestra el panel de éxito. */
  readonly created = signal<Quote | null>(null);
  readonly totals = signal<QuoteTotals>({ subtotal: 0, taxAmount: 0, total: 0 });

  readonly form = this.formBuilder.group({
    clientId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    currency: this.formBuilder.control<string>(DEFAULT_CURRENCY),
    issueDate: [this.todayIso(), [Validators.required]],
    validUntil: [''],
    taxRate: [0, [Validators.min(0), Validators.max(100)]],
    notes: ['', [Validators.maxLength(2000)]],
    items: this.formBuilder.array<FormGroup<QuoteItemForm>>([this.createItemGroup()]),
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.recomputeTotals());

    this.form.controls.clientId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((clientId) => this.applyClientCurrency(clientId));
  }

  get items(): FormGroup<QuoteItemForm>[] {
    return this.form.controls.items.controls;
  }

  get itemCount(): number {
    return this.form.controls.items.length;
  }

  get isEditing(): boolean {
    return this.quoteId() !== null;
  }

  ngOnInit(): void {
    this.loadClients();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.quoteId.set(id);
      this.loadQuote(id);
    }
  }

  addItem(): void {
    this.form.controls.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.form.controls.items.length <= 1) {
      return;
    }
    this.form.controls.items.removeAt(index);
  }

  amount(value: number): string {
    return formatAmount(value, this.form.controls.currency.value);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload = this.buildPayload();
    const id = this.quoteId();

    const request$ = id
      ? this.quoteService.update(id, payload)
      : this.quoteService.create(payload);

    request$.subscribe({
      next: (quote) => {
        if (id) {
          void this.router.navigate(['/presupuestos', quote.id]);
          return;
        }
        this.created.set(quote);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos guardar el presupuesto. Intenta nuevamente.'),
        );
        this.submitting.set(false);
      },
    });
  }

  /** Vuelve al formulario vacío para cargar otro presupuesto desde el panel de éxito. */
  createAnother(): void {
    this.created.set(null);
    this.error.set(null);
    this.submitting.set(false);
    this.resetForm();
  }

  number(quote: Quote): string {
    return formatQuoteNumber(quote.number);
  }

  private resetForm(): void {
    this.form.reset({
      clientId: '',
      title: '',
      currency: DEFAULT_CURRENCY,
      issueDate: this.todayIso(),
      validUntil: '',
      taxRate: 0,
      notes: '',
    });
    this.form.controls.items.clear();
    this.form.controls.items.push(this.createItemGroup());
    this.recomputeTotals();
  }

  private createItemGroup(initial?: { description: string; quantity: number; unitPrice: number }): FormGroup<QuoteItemForm> {
    return this.formBuilder.group<QuoteItemForm>({
      description: this.formBuilder.control(initial?.description ?? '', [
        Validators.required,
        Validators.maxLength(200),
      ]),
      quantity: this.formBuilder.control(initial?.quantity ?? 1, [
        Validators.required,
        Validators.min(0.01),
      ]),
      unitPrice: this.formBuilder.control(initial?.unitPrice ?? 0, [
        Validators.required,
        Validators.min(0),
      ]),
    });
  }

  private loadClients(): void {
    this.dependenciesLoading.set(true);
    this.clientService.list().subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.dependenciesLoading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus clientes.');
        this.dependenciesLoading.set(false);
      },
    });
  }

  private loadQuote(id: string): void {
    this.loading.set(true);
    this.quoteService.get(id).subscribe({
      next: (quote) => {
        this.form.patchValue({
          clientId: quote.clientId,
          title: quote.title,
          currency: quote.currency,
          issueDate: quote.issueDate,
          validUntil: quote.validUntil ?? '',
          taxRate: quote.taxRate,
          notes: quote.notes ?? '',
        });

        this.form.controls.items.clear();
        for (const item of quote.items ?? []) {
          this.form.controls.items.push(
            this.createItemGroup({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            }),
          );
        }
        if (this.form.controls.items.length === 0) {
          this.form.controls.items.push(this.createItemGroup());
        }

        this.recomputeTotals();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el presupuesto solicitado.');
        this.loading.set(false);
      },
    });
  }

  private applyClientCurrency(clientId: string): void {
    if (this.isEditing) {
      return;
    }
    const client = this.clients().find((item) => item.id === clientId);
    if (client) {
      this.form.controls.currency.setValue(client.currency);
    }
  }

  private buildPayload(): QuotePayload {
    const raw = this.form.getRawValue();
    const payload: QuotePayload = {
      clientId: raw.clientId,
      title: raw.title.trim(),
      currency: raw.currency,
      issueDate: raw.issueDate,
      taxRate: this.toAmount(raw.taxRate),
      items: raw.items.map((item) => ({
        description: item.description.trim(),
        quantity: this.toAmount(item.quantity),
        unitPrice: this.toAmount(item.unitPrice),
      })),
    };

    if (raw.validUntil) {
      payload.validUntil = raw.validUntil;
    }
    if (raw.notes.trim()) {
      payload.notes = raw.notes.trim();
    }

    return payload;
  }

  private recomputeTotals(): void {
    const subtotal = this.form.controls.items
      .getRawValue()
      .reduce((acc, item) => acc + this.toAmount(item.quantity) * this.toAmount(item.unitPrice), 0);
    const taxRate = this.toAmount(this.form.controls.taxRate.value);
    const taxAmount = (subtotal * taxRate) / 100;

    this.totals.set({
      subtotal: this.round2(subtotal),
      taxAmount: this.round2(taxAmount),
      total: this.round2(subtotal + taxAmount),
    });
  }

  private toAmount(value: number | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? this.round2(parsed) : 0;
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
