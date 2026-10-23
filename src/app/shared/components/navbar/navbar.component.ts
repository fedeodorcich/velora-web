import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  path: string;
  label: string;
}

interface MarketingLink {
  label: string;
  fragment: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './navbar.component.html',
  host: {
    '(document:keydown.escape)': 'closeMenu()',
  },
})
export class NavbarComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly links: readonly NavLink[] = [
    { path: '/clientes', label: 'Clientes' },
    { path: '/presupuestos', label: 'Presupuestos' },
    { path: '/proyectos', label: 'Proyectos' },
    { path: '/cobros', label: 'Cobros' },
  ];

  /** Navegación de la landing: anclas dentro de la página pública. */
  readonly marketingLinks: readonly MarketingLink[] = [
    { label: 'Producto', fragment: 'producto' },
    { label: 'Cómo funciona', fragment: 'como-funciona' },
    { label: 'Precios', fragment: 'precios' },
    { label: 'Preguntas', fragment: 'preguntas' },
  ];

  readonly menuOpen = signal(false);
  /** Menú de usuario (nombre): Editar perfil / Cerrar sesión. */
  readonly userMenuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    this.userMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
