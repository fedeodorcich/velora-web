import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination-controls.component.html',
})
export class PaginationControlsComponent {
  readonly page = input.required<number>();
  readonly limit = input.required<number>();
  readonly total = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();
  readonly limitChange = output<number>();

  readonly pageSizes = [12, 24, 48] as const;

  get firstItem(): number {
    return this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1;
  }

  get lastItem(): number {
    return Math.min(this.page() * this.limit(), this.total());
  }

  changeLimit(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.limitChange.emit(value);
  }
}
