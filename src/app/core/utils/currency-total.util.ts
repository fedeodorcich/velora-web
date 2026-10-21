export interface CurrencyTotal {
  currency: string;
  total: number;
}

/**
 * Agrupa importes por moneda sin mezclar divisas. Se usa para la cota de resumen
 * de los listados (presupuestos y proyectos).
 */
export function totalsByCurrency<T>(
  items: readonly T[],
  currencyOf: (item: T) => string,
  amountOf: (item: T) => number,
): CurrencyTotal[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    const currency = currencyOf(item);
    totals.set(currency, (totals.get(currency) ?? 0) + amountOf(item));
  }

  return [...totals].map(([currency, total]) => ({ currency, total }));
}
