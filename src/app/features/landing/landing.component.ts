import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Página pública de presentación del producto.
 * Es estática a propósito: no consulta la API ni depende de la sesión.
 */
@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './landing.component.html',
})
export class LandingComponent {}
