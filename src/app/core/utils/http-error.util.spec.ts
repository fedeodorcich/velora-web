import { HttpErrorResponse } from '@angular/common/http';

import { extractApiErrorMessage, extractApiErrorReason } from './http-error.util';

function buildError(status: number, error: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error });
}

describe('http-error.util', () => {
  describe('extractApiErrorMessage', () => {
    it('devuelve el mensaje simple del backend', () => {
      const error = buildError(409, { message: 'No puedes eliminar el cliente.' });
      expect(extractApiErrorMessage(error, 'fallback')).toBe('No puedes eliminar el cliente.');
    });

    it('une los mensajes cuando el backend devuelve un arreglo (validación)', () => {
      const error = buildError(400, { message: ['El nombre es obligatorio.', 'El email no es válido.'] });
      expect(extractApiErrorMessage(error, 'fallback')).toBe(
        'El nombre es obligatorio. El email no es válido.',
      );
    });

    it('usa el fallback si no hay mensaje', () => {
      const error = buildError(500, null);
      expect(extractApiErrorMessage(error, 'fallback')).toBe('fallback');
    });

    it('usa el fallback si el mensaje es una cadena vacía', () => {
      const error = buildError(400, { message: '   ' });
      expect(extractApiErrorMessage(error, 'fallback')).toBe('fallback');
    });
  });

  describe('extractApiErrorReason', () => {
    it('devuelve el motivo estructurado del 409', () => {
      const error = buildError(409, { message: 'x', reason: 'projects' });
      expect(extractApiErrorReason(error)).toBe('projects');
    });

    it('devuelve undefined si el cuerpo no incluye reason', () => {
      const error = buildError(409, { message: 'x' });
      expect(extractApiErrorReason(error)).toBeUndefined();
    });

    it('devuelve undefined si reason no es una cadena', () => {
      const error = buildError(409, { reason: 42 });
      expect(extractApiErrorReason(error)).toBeUndefined();
    });

    it('devuelve undefined si no hay cuerpo', () => {
      const error = buildError(409, null);
      expect(extractApiErrorReason(error)).toBeUndefined();
    });
  });
});
