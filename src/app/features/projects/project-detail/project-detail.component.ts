import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  Payment,
  formatPaymentNumber,
  paidPaymentsTotal,
  paymentStatusClass,
} from '../../../core/models/payment.model';
import {
  Project,
  formatProjectNumber,
  projectStatusClass,
} from '../../../core/models/project.model';
import { formatAmount } from '../../../core/models/quote.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ProjectService } from '../../../core/services/project.service';
import { extractApiErrorMessage, extractApiErrorReason } from '../../../core/utils/http-error.util';
import { PaymentStatusPipe } from '../../../shared/pipes/payment-status.pipe';
import { ProjectStatusPipe } from '../../../shared/pipes/project-status.pipe';
import { ShortDatePipe } from '../../../shared/pipes/short-date.pipe';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, ProjectStatusPipe, PaymentStatusPipe, ShortDatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './project-detail.component.html',
})
export class ProjectDetailComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);

  readonly project = signal<Project | null>(null);
  readonly payments = signal<Payment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  /** Total cobrado (cobros pagados) del proyecto. */
  readonly collected = computed(() => paidPaymentsTotal(this.payments()));
  /** Porcentaje cobrado respecto del monto acordado (`budget`). */
  readonly collectedPercent = computed(() => {
    const budget = this.project()?.budget ?? 0;
    if (budget <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.collected() / budget) * 100));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    } else {
      this.error.set('Proyecto no encontrado.');
      this.loading.set(false);
    }
  }

  number(): string {
    const project = this.project();
    return project ? formatProjectNumber(project.number) : '';
  }

  amount(): string {
    const project = this.project();
    return project ? formatAmount(project.budget, project.currency) : '';
  }

  collectedAmount(): string {
    const project = this.project();
    return project ? formatAmount(this.collected(), project.currency) : '';
  }

  paymentNumber(payment: Payment): string {
    return formatPaymentNumber(payment.number);
  }

  paymentAmount(payment: Payment): string {
    return formatAmount(payment.amount, payment.currency);
  }

  paymentClass(payment: Payment): string {
    return paymentStatusClass(payment);
  }

  statusClass(): string {
    const project = this.project();
    return project ? projectStatusClass(project.status) : '';
  }

  async remove(): Promise<void> {
    const project = this.project();
    if (!project) {
      return;
    }

    const confirmed = await this.confirm.confirm({
      title: 'Eliminar proyecto',
      message: `¿Seguro que querés eliminar el proyecto ${this.number()}? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.deleteProject(project, false);
  }

  private deleteProject(project: Project, cascade: boolean): void {
    this.projectService.remove(project.id, cascade).subscribe({
      next: () => {
        void this.router.navigateByUrl('/proyectos');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409 && !cascade && extractApiErrorReason(error) === 'payments') {
          void this.deleteWithPayments(project);
          return;
        }
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos eliminar el proyecto. Intenta nuevamente.'),
        );
      },
    });
  }

  /** El proyecto tiene cobros: ofrecemos el borrado en cascada con una segunda confirmación. */
  private async deleteWithPayments(project: Project): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Proyecto con cobros',
      message: `El proyecto ${this.number()} tiene cobros asociados. Si continuás, se eliminarán también todos sus cobros. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar todo',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.deleteProject(project, true);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.projectService.get(id).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
        this.loadPayments(id);
      },
      error: () => {
        this.error.set('No pudimos cargar el proyecto solicitado.');
        this.loading.set(false);
      },
    });
  }

  private loadPayments(projectId: string): void {
    this.paymentService.list().subscribe({
      next: (payments) => {
        this.payments.set(payments.filter((payment) => payment.projectId === projectId));
      },
      error: () => {
        this.payments.set([]);
      },
    });
  }
}
