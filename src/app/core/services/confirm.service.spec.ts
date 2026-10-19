import { TestBed } from '@angular/core/testing';

import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmService);
  });

  it('expone el diálogo activo con valores por defecto', () => {
    expect(service.request()).toBeNull();

    void service.confirm({ title: 'Eliminar', message: '¿Seguro?' });

    expect(service.request()).toEqual({
      title: 'Eliminar',
      message: '¿Seguro?',
      confirmLabel: 'Confirmar',
      cancelLabel: 'Cancelar',
      danger: false,
    });
  });

  it('respeta las opciones indicadas', () => {
    void service.confirm({
      title: 'Cliente con presupuestos',
      message: 'Mensaje',
      confirmLabel: 'Eliminar todo',
      cancelLabel: 'Volver',
      danger: true,
    });

    const request = service.request();
    expect(request?.confirmLabel).toBe('Eliminar todo');
    expect(request?.cancelLabel).toBe('Volver');
    expect(request?.danger).toBeTrue();
  });

  it('resuelve true al confirmar y limpia el estado', async () => {
    const result = service.confirm({ title: 'T', message: 'M' });

    service.accept();

    await expectAsync(result).toBeResolvedTo(true);
    expect(service.request()).toBeNull();
  });

  it('resuelve false al cancelar y limpia el estado', async () => {
    const result = service.confirm({ title: 'T', message: 'M' });

    service.cancel();

    await expectAsync(result).toBeResolvedTo(false);
    expect(service.request()).toBeNull();
  });

  it('resuelve false el diálogo pendiente si se abre otro', async () => {
    const first = service.confirm({ title: 'Primero', message: 'M' });
    const second = service.confirm({ title: 'Segundo', message: 'M' });

    await expectAsync(first).toBeResolvedTo(false);
    expect(service.request()?.title).toBe('Segundo');

    service.accept();
    await expectAsync(second).toBeResolvedTo(true);
  });

  it('ignora aceptar/cancelar si no hay diálogo activo', () => {
    expect(() => service.accept()).not.toThrow();
    expect(() => service.cancel()).not.toThrow();
    expect(service.request()).toBeNull();
  });
});
