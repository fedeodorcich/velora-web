import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LoadingSkeletonVariant = 'cards' | 'ledger' | 'form' | 'detail' | 'dashboard';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './loading-skeleton.component.html',
})
export class LoadingSkeletonComponent {
  readonly variant = input<LoadingSkeletonVariant>('cards');
  readonly label = input('contenido');
}
