import { Pipe, PipeTransform } from '@angular/core';
import { ProjectStatus, projectStatusLabel } from '../../core/models/project.model';

/** Traduce el estado del proyecto a su etiqueta legible en español. */
@Pipe({
  name: 'projectStatus',
  standalone: true,
})
export class ProjectStatusPipe implements PipeTransform {
  transform(status: ProjectStatus): string {
    return projectStatusLabel(status);
  }
}
