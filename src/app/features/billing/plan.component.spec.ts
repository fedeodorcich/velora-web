import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../core/config/api.config';
import { PlanComponent } from './plan.component';

const url = `${API_BASE_URL}/billing`;
const free = { plan: 'free', proUntil: null, quoteLogo: null, interestRegistered: false,
  checkout: null, activeClientLimit: 5, mercadoPagoTestPrice: null,
  oneTimeOffer: { amount: 2500, currency: 'ARS', months: 1, test: true } };

describe('Mi plan: pago único', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('muestra importe y pago único, evita dobles clics y explica un error del proveedor', () => {
    const fixture = TestBed.createComponent(PlanComponent);
    fixture.detectChanges();
    http.expectOne(url).flush(free);
    http.expectOne(`${url}/mercado-pago/purchases/latest`).flush(null);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('ARS 2500');
    expect(root.textContent).toContain('Sin renovación automática');
    const button = root.querySelector<HTMLButtonElement>('[data-mp-checkout-cta="checkout-pro"]')!;
    button.click(); fixture.detectChanges(); button.click();
    const checkout = http.expectOne(`${url}/mercado-pago/purchases`);
    expect(checkout.request.method).toBe('POST');
    expect(checkout.request.body).toBeNull();
    expect(button.disabled).toBeTrue();
    checkout.flush({ message: 'No pudimos abrir Mercado Pago. Volvé a intentarlo.' }, { status: 502, statusText: 'Bad Gateway' });
    fixture.detectChanges();
    expect(root.textContent).toContain('Volvé a intentarlo');
    expect(button.disabled).toBeFalse();
  });

  it('un estado aprobado en la URL no concede Pro', async () => {
    await TestBed.inject(Router).navigateByUrl('/?status=approved');
    const fixture = TestBed.createComponent(PlanComponent); fixture.detectChanges();
    http.expectOne(url).flush(free);
    http.expectOne(`${url}/mercado-pago/purchases/latest`).flush(null);
    fixture.detectChanges();
    expect(fixture.componentInstance.plan()?.plan).toBe('free');
    expect(fixture.componentInstance.purchase()).toBeNull();
  });

  it('consulta el payment_id al servidor antes de mostrar el resultado del retorno', async () => {
    const id = '00000000-0000-4000-8000-000000000001';
    await TestBed.inject(Router).navigateByUrl(`/?purchase=${id}&payment_id=123&status=approved`);
    const fixture = TestBed.createComponent(PlanComponent); fixture.detectChanges();
    const refresh = http.expectOne(`${url}/mercado-pago/purchases/${id}/refresh`);
    expect(refresh.request.body).toEqual({ paymentId: '123' });
    // El proveedor aún no confirmó el pago: no se muestra como aprobado.
    refresh.flush({ id, amount: 2500, currency: 'ARS', status: 'pending', validUntil: null });
    http.expectOne(url).flush(free);
    http.expectOne(`${url}/mercado-pago/purchases/latest`).flush({ id, amount: 2500, currency: 'ARS', status: 'pending', validUntil: null });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pago pendiente de confirmación');
    expect(fixture.componentInstance.plan()?.plan).toBe('free');
  });
});
