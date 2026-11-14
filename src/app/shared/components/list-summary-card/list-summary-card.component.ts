import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface ListSummaryMetric {
  label: string;
  value: string;
  detail?: string;
}

@Component({
  selector: 'app-list-summary-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './list-summary-card.component.html',
})
export class ListSummaryCardComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly metrics = input.required<readonly ListSummaryMetric[]>();
  readonly columns = input<4 | 5>(4);
}
