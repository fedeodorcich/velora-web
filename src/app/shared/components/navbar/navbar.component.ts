import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, RouterLinkActive],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
