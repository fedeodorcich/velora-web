import { provideHttpClient, withXhr } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

@Component({ template: '' })
class StubPageComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([
          { path: '', component: StubPageComponent },
          { path: 'clientes', component: StubPageComponent },
        ]),
        provideHttpClient(withXhr()),
      ],
    }).compileComponents();
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('deja la landing a todo el ancho y el resto dentro del contenedor', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isLanding()).toBe(true);

    await router.navigateByUrl('/clientes');
    fixture.detectChanges();

    const main = (fixture.nativeElement as HTMLElement).querySelector('main');

    expect(fixture.componentInstance.isLanding()).toBe(false);
    expect(main).toBeTruthy();
    expect(main?.className).toContain('max-w-6xl');
  });
});
