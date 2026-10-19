import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Estado vacío reutilizable con CTA proyectado.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
