import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './profile-form.component.html',
})
export class ProfileFormComponent {
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly user = this.auth.user;

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  /** El formulario de contraseña permanece oculto hasta que el usuario quiera cambiarla. */
  readonly passwordFormOpen = signal(false);
  readonly profileMessage = signal<string | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly passwordMessage = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);

  readonly profileForm = this.formBuilder.group({
    name: [this.auth.user()?.name ?? '', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  readonly passwordForm = this.formBuilder.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] },
  );

  submitProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.profileMessage.set(null);
    this.profileError.set(null);

    this.auth.updateProfile({ name: this.profileForm.controls.name.value }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileMessage.set('Perfil actualizado.');
      },
      error: (error: HttpErrorResponse) => {
        this.savingProfile.set(false);
        this.profileError.set(
          extractApiErrorMessage(error, 'No pudimos guardar tus datos. Intenta nuevamente.'),
        );
      },
    });
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.passwordMessage.set(null);
    this.passwordError.set(null);

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordMessage.set('Contraseña actualizada.');
        this.passwordForm.reset();
        this.passwordFormOpen.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.savingPassword.set(false);
        this.passwordError.set(
          extractApiErrorMessage(error, 'No pudimos cambiar tu contraseña. Intenta nuevamente.'),
        );
      },
    });
  }

  startPasswordChange(): void {
    this.passwordFormOpen.set(true);
  }

  /** Cierra el formulario descartando lo escrito y cualquier mensaje previo. */
  cancelPasswordChange(): void {
    this.passwordFormOpen.set(false);
    this.passwordForm.reset();
    this.passwordMessage.set(null);
    this.passwordError.set(null);
  }
}

/** El formulario es inválido si las dos contraseñas nuevas no coinciden. */
function passwordMatchValidator(group: {
  get(key: string): { value: string } | null;
}): { passwordMismatch: true } | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}
