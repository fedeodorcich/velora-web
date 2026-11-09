import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-record-list-row',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './record-list-row.component.html',
})
export class RecordListRowComponent {
  readonly reference = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly link = input.required<readonly (string | number)[]>();
  readonly linkLabel = input.required<string>();
  readonly dateValue = input.required<string>();
  readonly status = input.required<string>();
  readonly statusClass = input.required<string>();
  readonly amount = input.required<string>();
  readonly menuOpen = input(false);
  readonly menuLabel = input('Abrir acciones');
  readonly menuToggle = output<void>();
}
