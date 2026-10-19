import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorBody {
  message?: string | string[];
  reason?: string;
}

/**
 * Extrae el mensaje de error legible devuelto por el backend.
 * Soporta tanto mensajes simples como arreglos (validación de DTOs).
 */
export function extractApiErrorMessage(error: HttpErrorResponse, fallback: string): string {
  const body = error.error as ApiErrorBody | null;
  const message = body?.message;

  if (Array.isArray(message)) {
    const joined = message.filter((item) => typeof item === 'string').join(' ');
    if (joined.trim() !== '') {
      return joined;
    }
  }

  if (typeof message === 'string' && message.trim() !== '') {
    return message;
  }

  return fallback;
}

/**
 * Devuelve el motivo estructurado (`reason`) que algunos `409` incluyen en el cuerpo
 * (p. ej. `'quotes'` o `'projects'`), o `undefined` si no viene.
 */
export function extractApiErrorReason(error: HttpErrorResponse): string | undefined {
  const body = error.error as ApiErrorBody | null;
  return typeof body?.reason === 'string' ? body.reason : undefined;
}
