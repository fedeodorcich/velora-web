import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from './navbar.component';

function setup(isAuthenticated: boolean): HTMLElement {
  TestBed.configureTestingModule({
    imports: [NavbarComponent],
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          isAuthenticated: () => isAuthenticated,
          user: () => (isAuthenticated ? { name: 'Ana', email: 'ana@ejemplo.com' } : null),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(NavbarComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('NavbarComponent', () => {
  it('muestra la navegación de marketing cuando no hay sesión', () => {
    const element = setup(false);

    expect(element.textContent).toContain('Cómo funciona');
    expect(element.textContent).toContain('Ingresar');
    expect(element.textContent).toContain('Crear cuenta');
  });

  it('muestra la navegación del panel cuando hay sesión', () => {
    const element = setup(true);

    expect(element.textContent).toContain('Clientes');
    expect(element.textContent).toContain('Ana');
    expect(element.textContent).not.toContain('Crear cuenta');
  });
});
