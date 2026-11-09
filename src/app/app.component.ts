import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, NavbarComponent, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** La landing administra su propio ancho; el resto de las vistas usa el contenedor de la app. */
  readonly isLanding = computed(() => this.currentUrl().split('#')[0] === '/');

  /** Se mantiene el elemento `<main>` porque las reglas de impresión dependen de él. */
  readonly mainClass = computed(() =>
    this.isLanding()
      ? 'flex-1'
      : 'mx-auto w-full max-w-6xl flex-1 px-4 pb-8 pt-28 sm:px-6 sm:pb-10 sm:pt-32',
  );
}
