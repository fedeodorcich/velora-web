import { formatShortDate } from './format-date.util';

describe('formatShortDate', () => {
  it('formatea una fecha ISO sin hora con el día local', () => {
    expect(formatShortDate('2026-10-01')).toBe('1 oct 2026');
  });

  it('formatea una fecha con hora usando solo la parte de fecha', () => {
    expect(formatShortDate('2026-11-12T18:30:00.000Z')).toBe('12 nov 2026');
  });

  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatShortDate(null)).toBe('—');
    expect(formatShortDate(undefined)).toBe('—');
    expect(formatShortDate('')).toBe('—');
  });
});
