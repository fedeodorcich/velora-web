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
    expect(heading?.textContent).toContain('Tu trabajo, más simple.');
    expect(heading?.textContent).toContain('Todo en su lugar.');
    expect(element.querySelector('a[href="/registro"]')).toBeTruthy();
  });

  it('recorre el flujo de trabajo en cuatro etapas', () => {
    const steps = render().querySelectorAll('#como-funciona ol > li');

    expect(steps.length).toBe(4);
  });

  it('muestra las cinco preguntas frecuentes', () => {
    expect(render().querySelectorAll('details').length).toBe(5);
  });

  it('ofrece todas las funciones gratis y separa los aportes del acceso', () => {
    const element = render();const pricing = element.querySelector('#gratis');
    expect(pricing?.textContent).toContain('Todas las funciones, sin membresías');
    expect(pricing?.textContent).toContain('Sin límite de clientes');
    expect(element.textContent).not.toContain('US$9');
    expect(element.querySelector('a[href="/registro?plan=pro"]')).toBeNull();
    expect(element.querySelector('a[href="/apoyar"]')).toBeTruthy();
    expect(element.querySelector('a[href="/contacto"]')).toBeTruthy();
  });
});
