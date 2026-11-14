import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  PROJECT_STATUS_OPTIONS,
  Project,
  ProjectStatus,
  formatProjectNumber,
  projectStatusClass,
} from '../../../core/models/project.model';
import { PaginatedResult } from '../../../core/models/pagination.model';
import { formatAmount } from '../../../core/models/quote.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ProjectService } from '../../../core/services/project.service';
import { CurrencyTotal, totalsByCurrency } from '../../../core/utils/currency-total.util';
import { extractApiErrorMessage, extractApiErrorReason } from '../../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationControlsComponent } from '../../../shared/components/pagination-controls/pagination-controls.component';
import { RecordListRowComponent } from '../../../shared/components/record-list-row/record-list-row.component';
import { ListSummaryCardComponent, ListSummaryMetric } from '../../../shared/components/list-summary-card/list-summary-card.component';
import { ProjectStatusPipe } from '../../../shared/pipes/project-status.pipe';
import { ShortDatePipe } from '../../../shared/pipes/short-date.pipe';

type ProjectStatusFilter = ProjectStatus | 'todos';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, EmptyStateComponent, ProjectStatusPipe, ShortDatePipe, PaginationControlsComponent, LoadingSkeletonComponent, RecordListRowComponent, ListSummaryCardComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './project-list.component.html',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly confirm = inject(ConfirmService);

  readonly statusOptions = PROJECT_STATUS_OPTIONS;

  readonly projects = signal<Project[]>([]);
  readonly allProjects = signal<Project[]>([]);
  readonly page = signal(1);
  readonly pageSize = signal(12);
  readonly pagination = signal<PaginatedResult<Project> | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly statusFilter = signal<ProjectStatusFilter>('todos');
  /** Id del proyecto cuyo menú de acciones está abierto (solo uno a la vez). */
  readonly openMenuId = signal<string | null>(null);
  /** Id del proyecto con una actualización de estado en curso. */
  readonly updatingId = signal<string | null>(null);

  readonly visibleProjects = computed(() => {
    const filter = this.statusFilter();
    const all = this.projects();
    return filter === 'todos' ? all : all.filter((project) => project.status === filter);
  });

  /** Resumen general agrupado por moneda; no cambia al filtrar la lista. */
  readonly totals = computed(() =>
    totalsByCurrency(
      this.allProjects(),
      (project) => project.currency,
      (project) => project.budget,
    ),
  );

  readonly summaryMetrics = computed<ListSummaryMetric[]>(() => {
    const projects = this.allProjects();
    const budgetTotals = this.totals();
    const budgetValue = budgetTotals.length === 1 ? this.totalAmount(budgetTotals[0]) : `${budgetTotals.length} monedas`;
    const budgetDetails = budgetTotals.map((total) => this.totalAmount(total)).join(' · ');
    return [
      { label: 'Proyectos', value: String(projects.length), detail: 'en total' },
      { label: 'En progreso', value: String(projects.filter((project) => project.status === 'en_progreso').length) },
      { label: 'Planificados', value: String(projects.filter((project) => project.status === 'planificado').length) },
      { label: 'Pausados', value: String(projects.filter((project) => project.status === 'pausado').length) },
      { label: 'Presupuesto total', value: budgetValue, detail: budgetDetails || 'Sin importes registrados' },
    ];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      page: this.projectService.listPage({ page: this.page(), limit: this.pageSize(), status: this.statusFilter() === 'todos' ? undefined : this.statusFilter() }),
      all: this.projectService.list(),
    }).subscribe({
      next: ({ page: result, all }) => {
        if (result.totalPages > 0 && this.page() > result.totalPages) { this.page.set(result.totalPages); this.load(); return; }
        this.pagination.set(result);
        this.projects.set(result.items);
        this.allProjects.set(all);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus proyectos. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(value: ProjectStatusFilter): void { this.statusFilter.set(value); this.page.set(1); this.load(); }
  changePage(page: number): void { this.page.set(page); this.load(); }
  changePageSize(limit: number): void { this.pageSize.set(limit); this.page.set(1); this.load(); }

  async remove(project: Project): Promise<void> {
    this.closeMenu();

    const confirmed = await this.confirm.confirm({
      title: 'Eliminar proyecto',
      message: `¿Seguro que querés eliminar el proyecto ${this.number(project)}? Esta acción no se puede deshacer.`,
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
        this.load();
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
      message: `El proyecto ${this.number(project)} tiene cobros asociados. Si continuás, se eliminarán también todos sus cobros. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar todo',
      danger: true,
    });
    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.deleteProject(project, true);
  }

  number(project: Project): string {
    return formatProjectNumber(project.number);
  }

  isMenuOpen(project: Project): boolean {
    return this.openMenuId() === project.id;
  }

  toggleMenu(project: Project): void {
    this.openMenuId.update((current) => (current === project.id ? null : project.id));
  }

  closeMenu(): void {
    this.openMenuId.set(null);
  }

  changeStatus(project: Project, status: ProjectStatus): void {
    if (project.status === status || this.updatingId() === project.id) {
      this.closeMenu();
      return;
    }

    this.updatingId.set(project.id);
    this.error.set(null);

    this.projectService.updateStatus(project.id, status).subscribe({
      next: (updated) => {
        this.load();
        this.updatingId.set(null);
        this.closeMenu();
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(
          extractApiErrorMessage(error, 'No pudimos cambiar el estado del proyecto.'),
        );
        this.updatingId.set(null);
        this.closeMenu();
      },
    });
  }

  amount(project: Project): string {
    return formatAmount(project.budget, project.currency);
  }

  totalAmount(entry: CurrencyTotal): string {
    return formatAmount(entry.total, entry.currency);
  }

  statusClass(project: Project): string {
    return projectStatusClass(project.status);
  }

  filterChipClass(value: ProjectStatusFilter): string {
    return this.statusFilter() === value
      ? 'border-accent bg-accent text-ground'
      : 'border-rule text-ink-3 hover:border-rule-strong hover:text-ink';
  }
}
