import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../core/config/api.config';
import { DashboardSummary } from '../../core/services/dashboard.service';
import { DashboardComponent } from './dashboard.component';

const summary: DashboardSummary = {
  metrics: {
    activeProjectsCount: 1,
    pendingQuotesCount: 2,
    totalClientsCount: 3,
  },
  financials: [
    {
      currency: 'USD',
      collectedThisMonth: 2000,
      pendingTotal: 1500,
      overdueTotal: 1000,
      overdueCount: 1,
    },
  ],
  upcomingPayments: [
    {
      id: 'payment-1',
      number: 1,
      concept: 'Anticipo',
      amount: 1000,
      currency: 'USD',
      dueDate: '2026-10-01',
      status: 'pendiente',
      isOverdue: true,
      projectName: 'Landing',
      clientName: 'Cliente A',
    },
  ],
  recentProjects: [
    {
      id: 'project-1',
      code: 'PRY-0001',
      name: 'Landing',
      clientName: 'Cliente A',
      status: 'en_progreso',
      budget: 2000,
      collectedAmount: 1000,
      currency: 'USD',
    },
  ],
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let httpMock: HttpTestingController;

  async function setup(response: DashboardSummary = summary): Promise<HTMLElement> {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    httpMock.expectOne(`${API_BASE_URL}/dashboard/summary`).flush(response);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('muestra el resumen financiero, los cobros y los proyectos activos', async () => {
    const element = await setup();

    expect(component.summary()).toEqual(summary);
    expect(element.textContent).toContain('Cobrado este mes');
    expect(element.textContent).toContain('Próximos cobros');
    expect(element.textContent).toContain('Anticipo');
    expect(element.textContent).toContain('PRY-0001');
  });

  it('marca un cobro como pagado y recarga el panel', async () => {
    await setup();

    component.markAsPaid(summary.upcomingPayments[0]);

    const request = httpMock.expectOne(`${API_BASE_URL}/payments/payment-1/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'pagado' });
    request.flush({ id: 'payment-1', status: 'pagado' });

    httpMock.expectOne(`${API_BASE_URL}/dashboard/summary`).flush({
      ...summary,
      financials: [{ ...summary.financials[0], pendingTotal: 500, overdueTotal: 0, overdueCount: 0 }],
      upcomingPayments: [],
    });

    expect(component.updatingId()).toBeNull();
    expect(component.summary()?.upcomingPayments.length).toBe(0);
  });

  it('calcula el porcentaje cobrado sin superar el 100%', async () => {
    await setup();

    expect(component.collectedPercent(summary.recentProjects[0])).toBe(50);
    expect(
      component.collectedPercent({ ...summary.recentProjects[0], collectedAmount: 3000 }),
    ).toBe(100);
    expect(component.collectedPercent({ ...summary.recentProjects[0], budget: 0 })).toBe(0);
  });

  it('usa un estado vacío cuando todavía no hay datos', async () => {
    const element = await setup({
      metrics: { activeProjectsCount: 0, pendingQuotesCount: 0, totalClientsCount: 0 },
      financials: [],
      upcomingPayments: [],
      recentProjects: [],
    });

    expect(component.isEmpty()).toBeTrue();
    expect(element.textContent).toContain('Tu panel está listo para empezar');
  });
});
