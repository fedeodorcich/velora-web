import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

import {
  Payment,
  PaymentCreatePayload,
  PaymentUpdatePayload,
  formatPaymentNumber,
} from '../../../core/models/payment.model';
import { Project, formatProjectNumber } from '../../../core/models/project.model';
import { PaymentService } from '../../../core/services/payment.service';
import { ProjectService } from '../../../core/services/project.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-payment-form',
  imports: [ReactiveFormsModule, RouterLink, LoadingSkeletonComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './payment-form.component.html',
})
export class PaymentFormComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly projectService = inject(ProjectService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  /** Proyectos ofrecidos como origen del nuevo cobro. */
  readonly projects = signal<Project[]>([]);
  /** Cobro cargado (solo en edición). */
  readonly payment = signal<Payment | null>(null);
  /** Proyecto elegido en la creación (para mostrar la moneda derivada). */
  readonly selectedProject = signal<Project | null>(null);
  /** Proyecto de contexto: el elegido al crear o el del cobro al editar. */
  readonly projectContext = computed(
    () => this.selectedProject() ?? this.payment()?.project ?? null,
  );
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly paymentId = signal<string | null>(null);
  /** Cobro recién creado: si tiene valor, se muestra el panel de éxito. */
  readonly created = signal<Payment | null>(null);

  readonly form = this.formBuilder.group({
    projectId: [''],
    concept: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    dueDate: ['', [Validators.required]],
    method: ['', [Validators.maxLength(40)]],
    notes: ['', [Validators.maxLength(2000)]],
  });

  constructor() {
    this.form.controls.projectId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((projectId) => {
        if (this.isEditing) {
          return;
        }
        this.selectedProject.set(this.projects().find((project) => project.id === projectId) ?? null);
      });
  }

  get isEditing(): boolean {
    return this.paymentId() !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.paymentId.set(id);
      this.loadPayment(id);
      return;
    }

    this.form.controls.projectId.setValidators([Validators.required]);
    this.form.controls.projectId.updateValueAndValidity();
    this.loadProjects((projects) => this.resolveProjectParam(projects));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const id = this.paymentId();
    const request$ = id
      ? this.paymentService.update(id, this.buildUpdatePayload())
      : this.paymentService.create(this.buildCreatePayload());

    request$.subscribe({
      next: (payment) => {
        if (id) {
          void this.router.navigateByUrl('/cobros');
          return;
        }
        this.created.set(payment);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos guardar el cobro. Intenta nuevamente.'),
        );
        this.submitting.set(false);
      },
    });
  }

  /** Vuelve al formulario vacío para cargar otro cobro desde el panel de éxito. */
  createAnother(): void {
    this.created.set(null);
    this.error.set(null);
    this.submitting.set(false);
    this.resetForm();
  }

  number(payment: Payment): string {
    return formatPaymentNumber(payment.number);
  }

  projectCode(project: Project): string {
    return formatProjectNumber(project.number);
  }

  projectClientName(project: Project | null | undefined): string {
    const client = project?.client;
    if (!client) {
      return 'Cliente no disponible';
    }
    return client.company ?? client.name;
  }

  currency(): string {
    return (this.isEditing ? this.payment()?.currency : this.selectedProject()?.currency) ?? '';
  }

  private resetForm(): void {
    this.selectedProject.set(null);
    this.form.reset({
      projectId: '',
      concept: '',
      amount: 0,
      dueDate: '',
      method: '',
      notes: '',
    });
  }

  private loadPayment(id: string): void {
    this.loading.set(true);
    this.paymentService.get(id).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.form.patchValue({
          concept: payment.concept,
          amount: payment.amount,
          dueDate: payment.dueDate,
          method: payment.method ?? '',
          notes: payment.notes ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el cobro solicitado.');
        this.loading.set(false);
      },
    });
  }

  private loadProjects(done?: (projects: Project[]) => void): void {
    this.loading.set(true);
    this.projectService.list().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
        done?.(projects);
      },
      error: () => {
        this.projects.set([]);
        this.loading.set(false);
        done?.([]);
      },
    });
  }

  /** Resuelve el `?projectId=` del botón "Agregar cobro" del detalle del proyecto. */
  private resolveProjectParam(projects: Project[]): void {
    const projectId = this.route.snapshot.queryParamMap.get('projectId');
    if (!projectId) {
      return;
    }

    if (projects.some((project) => project.id === projectId)) {
      this.form.controls.projectId.setValue(projectId);
      return;
    }

    this.error.set('Ese proyecto no existe o no te pertenece.');
  }

  private buildCreatePayload(): PaymentCreatePayload {
    const raw = this.form.getRawValue();
    const payload: PaymentCreatePayload = {
      projectId: raw.projectId,
      concept: raw.concept.trim(),
      amount: this.toAmount(raw.amount),
      dueDate: raw.dueDate,
    };

    if (raw.method.trim()) {
      payload.method = raw.method.trim();
    }
    if (raw.notes.trim()) {
      payload.notes = raw.notes.trim();
    }

    return payload;
  }

  private buildUpdatePayload(): PaymentUpdatePayload {
    const raw = this.form.getRawValue();
    const payload: PaymentUpdatePayload = {
      concept: raw.concept.trim(),
      amount: this.toAmount(raw.amount),
      dueDate: raw.dueDate,
      method: raw.method.trim(),
      notes: raw.notes.trim(),
    };

    return payload;
  }

  private toAmount(value: number | null | undefined): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : 0;
  }
}
