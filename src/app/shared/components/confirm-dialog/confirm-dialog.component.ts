import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import { ConfirmService } from '../../../core/services/confirm.service';

/**
 * Diálogo de confirmación global. Se monta una sola vez en `AppComponent` y se
 * controla desde `ConfirmService`. Usa el `<dialog>` nativo para tener ESC,
 * foco atrapado y *top layer* gratis.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const request = this.confirm.request();
      const element = this.dialog()?.nativeElement;
      if (!element) {
        return;
      }

      if (request && !element.open) {
        element.showModal();
      } else if (!request && element.open) {
        element.close();
      }
    });
  }

  /** Cierra al hacer clic fuera del panel (sobre el *backdrop*). */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.confirm.cancel();
    }
  }
}
