import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('presenta el titular y la llamada a la acción principal', () => {
    const element = render();

    const heading = element.querySelector('h1');
    expect(heading?.textContent).toContain('Más tiempo creando.');
    expect(heading?.textContent).toContain('Menos tiempo siguiendo.');
    expect(element.querySelector('a[href="/registro"]')).toBeTruthy();
  });

  it('recorre el flujo de trabajo en cuatro etapas', () => {
    const steps = render().querySelectorAll('#como-funciona ol > li');

    expect(steps.length).toBe(4);
  });

  it('muestra las cinco preguntas frecuentes', () => {
    expect(render().querySelectorAll('details').length).toBe(5);
  });

  it('presenta los dos planes y conserva la intención de activar Pro al registrarse', () => {
    const pricing = render().querySelector('#precios');

    expect(pricing?.textContent).toContain('Plan Gratis');
    expect(pricing?.textContent).toContain('Hasta 5 clientes activos');
    expect(pricing?.textContent).toContain('Plan Pro');
    expect(pricing?.textContent).toContain('US$9');
    expect(pricing?.querySelector('a[href="/registro?plan=pro"]')).toBeTruthy();
  });
});
