import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  PROJECT_STATUS_OPTIONS,
  Project,
  ProjectStatus,
  formatProjectNumber,
  projectStatusClass,
} from '../../../core/models/project.model';
import { formatAmount } from '../../../core/models/quote.model';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ProjectService } from '../../../core/services/project.service';
import { CurrencyTotal, totalsByCurrency } from '../../../core/utils/currency-total.util';
import { extractApiErrorMessage, extractApiErrorReason } from '../../../core/utils/http-error.util';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ProjectStatusPipe } from '../../../shared/pipes/project-status.pipe';

type ProjectStatusFilter = ProjectStatus | 'todos';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, EmptyStateComponent, ProjectStatusPipe],
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

  /** Cota de resumen: presupuesto visible agrupado por moneda. */
  readonly totals = computed(() =>
    totalsByCurrency(
      this.visibleProjects(),
      (project) => project.currency,
      (project) => project.budget,
    ),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.projectService.list().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus proyectos. Intenta nuevamente.');
        this.loading.set(false);
      },
    });
  }

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
        this.projects.update((list) => list.filter((item) => item.id !== project.id));
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
        this.projects.update((list) =>
          list.map((item) => (item.id === project.id ? { ...item, status: updated.status } : item)),
        );
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
      ? 'border-cyan bg-cyan text-ground'
      : 'border-rule text-ink-3 hover:border-rule-strong hover:text-ink';
  }
}
