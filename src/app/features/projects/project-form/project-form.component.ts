import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { Client, CURRENCY_OPTIONS, DEFAULT_CURRENCY } from '../../../core/models/client.model';
import {
  Project,
  ProjectCreatePayload,
  ProjectUpdatePayload,
  approvedQuotesWithoutProject,
  formatProjectNumber,
} from '../../../core/models/project.model';
import {
  Quote,
  formatAmount,
  formatQuoteNumber,
  quoteStatusLabel,
} from '../../../core/models/quote.model';
import { ProjectService } from '../../../core/services/project.service';
import { QuoteService } from '../../../core/services/quote.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './project-form.component.html',
})
export class ProjectFormComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly quoteService = inject(QuoteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly currencyOptions = CURRENCY_OPTIONS;

  /** Presupuestos aprobados sin proyecto, ofrecidos como origen del nuevo proyecto. */
  readonly quotes = signal<Quote[]>([]);  /** Proyecto cargado (solo en edición). */
  readonly project = signal<Project | null>(null);
  /** Presupuesto de origen elegido (para mostrar los datos derivados). */
  readonly selectedQuote = signal<Quote | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly projectId = signal<string | null>(null);
  /** Proyecto recién creado: si tiene valor, se muestra el panel de éxito. */
  readonly created = signal<Project | null>(null);

  readonly form = this.formBuilder.group({
    quoteId: [''],
    name: [''],
    currency: this.formBuilder.control<string>(DEFAULT_CURRENCY),
    budget: [0, [Validators.min(0)]],
    progress: [0, [Validators.min(0), Validators.max(100)]],
    startDate: [''],
    dueDate: [''],
    description: ['', [Validators.maxLength(2000)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  constructor() {
    this.form.controls.quoteId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((quoteId) => {
        if (this.isEditing) {
          return;
        }
        this.selectedQuote.set(this.quotes().find((quote) => quote.id === quoteId) ?? null);
      });
  }

  get isEditing(): boolean {
    return this.projectId() !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      this.form.controls.name.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(200),
      ]);
      this.form.controls.name.updateValueAndValidity();
      this.loadProject(id);
      return;
    }

    this.form.controls.quoteId.setValidators([Validators.required]);
    this.form.controls.quoteId.updateValueAndValidity();
    this.loadAvailableQuotes((available) => this.resolveQuoteParam(available));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const id = this.projectId();
    const request$ = id
      ? this.projectService.update(id, this.buildUpdatePayload())
      : this.projectService.create(this.buildCreatePayload());

    request$.subscribe({
      next: (project) => {
        if (id) {
          void this.router.navigate(['/proyectos', project.id]);
          return;
        }
        this.created.set(project);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos guardar el proyecto. Intenta nuevamente.'),
        );
        this.submitting.set(false);
      },
    });
  }

  /** Vuelve al formulario vacío para cargar otro proyecto desde el panel de éxito. */
  createAnother(): void {
    this.created.set(null);
    this.error.set(null);
    this.submitting.set(false);
    this.resetForm();
  }

  number(project: Project): string {
    return formatProjectNumber(project.number);
  }

  quoteCode(quote: Quote): string {
    return formatQuoteNumber(quote.number);
  }

  quoteStatus(quote: Quote): string {
    return quoteStatusLabel(quote.status);
  }

  amount(value: number, currency: string): string {
    return formatAmount(value, currency);
  }

  clientName(client: Client | undefined | null): string {
    if (!client) {
      return 'Cliente no disponible';
    }
    return client.company ?? client.name;
  }

  private resetForm(): void {
    this.selectedQuote.set(null);
    this.form.reset({
      quoteId: '',
      name: '',
      currency: DEFAULT_CURRENCY,
      budget: 0,
      progress: 0,
      startDate: '',
      dueDate: '',
      description: '',
      notes: '',
    });
  }

  private loadProject(id: string): void {
    this.loading.set(true);
    this.projectService.get(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.form.patchValue({
          name: project.name,
          currency: project.currency,
          budget: project.budget,
          progress: project.progress,
          startDate: project.startDate ?? '',
          dueDate: project.dueDate ?? '',
          description: project.description ?? '',
          notes: project.notes ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el proyecto solicitado.');
        this.loading.set(false);
      },
    });
  }

  private loadAvailableQuotes(done?: (available: Quote[]) => void): void {
    this.loading.set(true);
    forkJoin({
      quotes: this.quoteService.list(),
      projects: this.projectService.list().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ quotes, projects }) => {
        const available = approvedQuotesWithoutProject(quotes, projects);
        this.quotes.set(available);
        this.loading.set(false);
        done?.(available);
      },
      error: () => {
        this.quotes.set([]);
        this.loading.set(false);
        done?.([]);
      },
    });
  }

  /** Resuelve el `?quoteId=` del botón "Convertir en proyecto". */
  private resolveQuoteParam(available: Quote[]): void {
    const quoteId = this.route.snapshot.queryParamMap.get('quoteId');
    if (!quoteId) {
      return;
    }

    if (available.some((quote) => quote.id === quoteId)) {
      this.form.controls.quoteId.setValue(quoteId);
      return;
    }

    this.error.set('Ese presupuesto ya tiene un proyecto o no está aprobado.');
  }

  private buildCreatePayload(): ProjectCreatePayload {
    const raw = this.form.getRawValue();
    const payload: ProjectCreatePayload = {
      quoteId: raw.quoteId,
      progress: Math.round(this.toAmount(raw.progress)),
    };

    if (raw.startDate) {
      payload.startDate = raw.startDate;
    }
    if (raw.dueDate) {
      payload.dueDate = raw.dueDate;
    }
    if (raw.description.trim()) {
      payload.description = raw.description.trim();
    }
    if (raw.notes.trim()) {
      payload.notes = raw.notes.trim();
    }

    return payload;
  }

  private buildUpdatePayload(): ProjectUpdatePayload {
    const raw = this.form.getRawValue();
    const payload: ProjectUpdatePayload = {
      name: raw.name.trim(),
      currency: raw.currency,
      budget: this.toAmount(raw.budget),
      progress: Math.round(this.toAmount(raw.progress)),
    };

    if (raw.startDate) {
      payload.startDate = raw.startDate;
    }
    if (raw.dueDate) {
      payload.dueDate = raw.dueDate;
    }
    if (raw.description.trim()) {
      payload.description = raw.description.trim();
    }
    if (raw.notes.trim()) {
      payload.notes = raw.notes.trim();
    }

    return payload;
  }

  private toAmount(value: number | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : 0;
  }
}
