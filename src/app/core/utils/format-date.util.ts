/** Coincide con fechas ISO sin hora (`YYYY-MM-DD`) o con hora (`YYYY-MM-DDTHH:mm…`). */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * Formatea una fecha de la API como `1 oct 2026`.
 *
 * Las fechas sin hora se interpretan en horario local: `new Date('2026-10-01')`
 * las tomaría como UTC y en Argentina mostraría el día anterior.
 */
export function formatShortDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const match = ISO_DATE.exec(value);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
