import { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from './navbar.component';

interface Setup {
  fixture: ComponentFixture<NavbarComponent>;
  element: HTMLElement;
  logout: jasmine.Spy;
  navigateByUrl: jasmine.Spy;
}

function setup(isAuthenticated: boolean): Setup {
  const logout = jasmine.createSpy('logout');

  TestBed.configureTestingModule({
    imports: [NavbarComponent],
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          isAuthenticated: () => isAuthenticated,
          user: () => (isAuthenticated ? { name: 'Ana', email: 'ana@ejemplo.com' } : null),
          logout,
        },
      },
    ],
  });

  const navigateByUrl = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
  const fixture = TestBed.createComponent(NavbarComponent);
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement, logout, navigateByUrl };
}

describe('NavbarComponent', () => {
  it('muestra la navegación de marketing cuando no hay sesión', () => {
    const { element } = setup(false);

    expect(element.textContent).toContain('Cómo funciona');
    expect(element.textContent).toContain('Ingresar');
    expect(element.textContent).toContain('Crear cuenta');
  });

  it('muestra la navegación del panel cuando hay sesión', () => {
    const { element } = setup(true);

    expect(element.textContent).toContain('Clientes');
    expect(element.textContent).toContain('Ana');
    expect(element.textContent).not.toContain('Crear cuenta');
  });

  it('cierra la sesión y navega al login desde el menú de usuario', () => {
    const { fixture, element, logout, navigateByUrl } = setup(true);

    element.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')?.click();
    fixture.detectChanges();

    const cerrar = [...element.querySelectorAll<HTMLButtonElement>('[role="menu"] button')].find(
      (button) => button.textContent?.includes('Cerrar sesión'),
    );
    cerrar?.click();

    expect(cerrar).toBeDefined();
    expect(logout).toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
