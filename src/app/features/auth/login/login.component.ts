import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { LoginPayload } from '../../../core/models/auth.model';
import { AuthService } from '../../../core/services/auth.service';
import { extractApiErrorMessage } from '../../../core/utils/http-error.util';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.Eager,
    templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const payload: LoginPayload = this.form.getRawValue();
    this.authService.login(payload).subscribe({
      next: () => {
        void this.router.navigateByUrl('/dashboard');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(extractApiErrorMessage(error, 'No pudimos iniciar sesión. Intenta nuevamente.'));
        this.submitting.set(false);
      },
    });
  }
}
