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

    expect(element.querySelector('h1')?.textContent).toContain(
      'Presupuestá, ejecutá y cobrá.',
    );
    expect(element.querySelector('a[href="/registro"]')).toBeTruthy();
  });

  it('recorre el flujo de trabajo en cuatro etapas', () => {
    const steps = render().querySelectorAll('#como-funciona ol > li');

    expect(steps.length).toBe(4);
  });

  it('muestra las cinco preguntas frecuentes', () => {
    expect(render().querySelectorAll('details').length).toBe(5);
  });

  it('no anuncia todavía un plan pago', () => {
    const element = render();

    expect(element.querySelector('[data-plan="free"]')).toBeTruthy();
    expect(element.querySelector('[data-plan="pro"]')).toBeNull();
  });
});
