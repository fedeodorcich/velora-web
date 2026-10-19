import { Injectable, signal } from '@angular/core';

/** Opciones de un diálogo de confirmación. */
export interface ConfirmDialogOptions {
  /** Título del diálogo. */
  title: string;
  /** Mensaje principal, en español. */
  message: string;
  /** Texto del botón de confirmación. Por defecto, "Confirmar". */
  confirmLabel?: string;
  /** Texto del botón de cancelación. Por defecto, "Cancelar". */
  cancelLabel?: string;
  /** Si es una acción destructiva (botón rojo). Por defecto, `false`. */
  danger?: boolean;
}

/** Estado ya normalizado que consume `ConfirmDialogComponent`. */
export interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
}

/**
 * Servicio global para pedir confirmaciones con un modal propio (en lugar de
 * `window.confirm`). El diálogo se monta una sola vez en `AppComponent`.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly state = signal<ConfirmDialogState | null>(null);
  private resolvePending: ((value: boolean) => void) | null = null;

  /** Diálogo activo, o `null` si no hay ninguno. */
  readonly request = this.state.asReadonly();

  /**
   * Muestra un diálogo de confirmación.
   * Resuelve `true` si el usuario confirma y `false` si cancela
   * (o si otro diálogo reemplaza al actual).
   */
  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    this.settle(false);

    return new Promise<boolean>((resolve) => {
      this.resolvePending = resolve;
      this.state.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel ?? 'Cancelar',
        danger: options.danger ?? false,
      });
    });
  }

  /** Confirma el diálogo activo. */
  accept(): void {
    this.settle(true);
  }

  /** Cancela el diálogo activo. */
  cancel(): void {
    this.settle(false);
  }

  private settle(value: boolean): void {
    const resolve = this.resolvePending;
    if (!resolve) {
      return;
    }

    this.resolvePending = null;
    this.state.set(null);
    resolve(value);
  }
}
