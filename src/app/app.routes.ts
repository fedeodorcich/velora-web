import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicOnlyGuard } from './core/guards/public-only.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [publicOnlyGuard],
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'terminos',
    loadComponent: () =>
      import('./features/legal/terms/terms.component').then((m) => m.TermsComponent),
  },
  {
    path: 'privacidad',
    loadComponent: () =>
      import('./features/legal/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'clientes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clients/client-list/client-list.component').then((m) => m.ClientListComponent),
  },
  {
    path: 'clientes/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clients/client-form/client-form.component').then((m) => m.ClientFormComponent),
  },
  {
    path: 'clientes/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/clients/client-form/client-form.component').then((m) => m.ClientFormComponent),
  },
  {
    path: 'presupuestos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quotes/quote-list/quote-list.component').then((m) => m.QuoteListComponent),
  },
  {
    path: 'presupuestos/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quotes/quote-form/quote-form.component').then((m) => m.QuoteFormComponent),
  },
  {
    path: 'presupuestos/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quotes/quote-form/quote-form.component').then((m) => m.QuoteFormComponent),
  },
  {
    path: 'presupuestos/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/quotes/quote-detail/quote-detail.component').then((m) => m.QuoteDetailComponent),
  },
  {
    path: 'proyectos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/projects/project-list/project-list.component').then((m) => m.ProjectListComponent),
  },
  {
    path: 'proyectos/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/projects/project-form/project-form.component').then((m) => m.ProjectFormComponent),
  },
  {
    path: 'proyectos/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/projects/project-form/project-form.component').then((m) => m.ProjectFormComponent),
  },
  {
    path: 'proyectos/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/projects/project-detail/project-detail.component').then((m) => m.ProjectDetailComponent),
  },
  {
    path: 'cobros',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payments/payment-list/payment-list.component').then((m) => m.PaymentListComponent),
  },
  {
    path: 'cobros/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payments/payment-form/payment-form.component').then((m) => m.PaymentFormComponent),
  },
  {
    path: 'cobros/:id/editar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payments/payment-form/payment-form.component').then((m) => m.PaymentFormComponent),
  },
  {
    path: 'plan',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/plan.component').then((m) => m.PlanComponent),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile-form/profile-form.component').then((m) => m.ProfileFormComponent),
  },
  { path: '**', redirectTo: '' },
];
