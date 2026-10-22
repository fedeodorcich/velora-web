import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProfileFormComponent } from './profile-form.component';

describe('ProfileFormComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => localStorage.clear());

  it('crea el componente con los dos formularios', () => {
    const fixture = TestBed.createComponent(ProfileFormComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.profileForm).toBeTruthy();
    expect(component.passwordForm).toBeTruthy();
  });

  it('mantiene oculto el formulario de contraseña hasta que el usuario lo pida', () => {
    const fixture = TestBed.createComponent(ProfileFormComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.passwordFormOpen()).toBe(false);

    component.startPasswordChange();
    fixture.detectChanges();
    expect(component.passwordFormOpen()).toBe(true);
  });

  it('al cancelar cierra el formulario, lo limpia y descarta los mensajes', () => {
    const fixture = TestBed.createComponent(ProfileFormComponent);
    const component = fixture.componentInstance;
    component.startPasswordChange();
    component.passwordForm.setValue({
      currentPassword: 'secreto123',
      newPassword: 'nuevaClave123',
      confirmPassword: 'nuevaClave123',
    });
    component.passwordError.set('algo salió mal');
    component.passwordMessage.set('mensaje viejo');

    component.cancelPasswordChange();

    expect(component.passwordFormOpen()).toBe(false);
    expect(component.passwordForm.value.currentPassword).toBe('');
    expect(component.passwordError()).toBeNull();
    expect(component.passwordMessage()).toBeNull();
  });

  it('marca inválido el formulario de contraseña si las nuevas no coinciden', () => {
    const fixture = TestBed.createComponent(ProfileFormComponent);
    const component = fixture.componentInstance;

    component.passwordForm.setValue({
      currentPassword: 'secreto123',
      newPassword: 'nuevaClave123',
      confirmPassword: 'otraClave123',
    });

    expect(component.passwordForm.errors?.['passwordMismatch']).toBe(true);
  });

  it('acepta el formulario de contraseña cuando las nuevas coinciden', () => {
    const fixture = TestBed.createComponent(ProfileFormComponent);
    const component = fixture.componentInstance;

    component.passwordForm.setValue({
      currentPassword: 'secreto123',
      newPassword: 'nuevaClave123',
      confirmPassword: 'nuevaClave123',
    });

    expect(component.passwordForm.errors).toBeNull();
    expect(component.passwordForm.valid).toBe(true);
  });
});
