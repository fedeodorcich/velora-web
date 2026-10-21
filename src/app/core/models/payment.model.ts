import { Project } from './project.model';

export type PaymentStatus = 'pendiente' | 'pagado';

/** Estado visible del cobro: agrega `vencido`, que se calcula (no se persiste). */
export type PaymentDisplayStatus = PaymentStatus | 'vencido';

/** Cobro (cuota) de un proyecto, perteneciente a un usuario (freelancer). */
export interface Payment {
  id: string;
  userId: string;
  projectId: string;
  /** Proyecto al que pertenece; el backend lo incluye en listado y detalle. */
  project?: Project;
  /** Correlativo por usuario, expuesto como `COB-0001`. */
  number: number;
  concept: string;
  amount: number;
  /** Moneda derivada del proyecto. */
  currency: string;
  dueDate: string;
  status: PaymentStatus;
  /** Se completa al marcar pagado. */
  paidAt: string | null;
  method: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Datos enviados al crear un cobro (la moneda se deriva del proyecto). */
export interface PaymentCreatePayload {
  projectId: string;
  concept: string;
  amount: number;
  dueDate: string;
  method?: string;
  notes?: string;
}

/** Datos editables de un cobro (el proyecto y la moneda no se modifican). */
export interface PaymentUpdatePayload {
  concept?: string;
  amount?: number;
  dueDate?: string;
  method?: string;
  notes?: string;
}

export interface PaymentDisplayOption {
  value: PaymentDisplayStatus;
  label: string;
}

export const PAYMENT_DISPLAY_OPTIONS: readonly PaymentDisplayOption[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'pagado', label: 'Pagado' },
];

/** Formatea el correlativo interno (`1`) como código visible (`COB-0001`). */
export function formatPaymentNumber(number: number): string {
  return `COB-${String(number).padStart(4, '0')}`;
}

/** Fecha local de hoy en formato ISO corto (`YYYY-MM-DD`), para comparar vencimientos. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Un cobro está vencido si sigue pendiente y su vencimiento ya pasó. */
export function isOverdue(payment: Payment, today: string = todayIso()): boolean {
  return payment.status === 'pendiente' && payment.dueDate < today;
}

export function paymentDisplayStatus(
  payment: Payment,
  today: string = todayIso(),
): PaymentDisplayStatus {
  if (payment.status === 'pagado') {
    return 'pagado';
  }
  return isOverdue(payment, today) ? 'vencido' : 'pendiente';
}

export function paymentDisplayLabel(payment: Payment, today: string = todayIso()): string {
  switch (paymentDisplayStatus(payment, today)) {
    case 'pagado':
      return 'Pagado';
    case 'vencido':
      return 'Vencido';
    default:
      return 'Pendiente';
  }
}

/** Filete y color de texto para la etiqueta de estado del cobro. */
export function paymentStatusClass(payment: Payment, today: string = todayIso()): string {
  switch (paymentDisplayStatus(payment, today)) {
    case 'pagado':
      return 'border-cyan/40 text-cyan';
    case 'vencido':
      return 'border-coral/40 text-coral';
    default:
      return 'border-amber/40 text-amber';
  }
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Suma de los cobros **pagados** (para el progreso cobrado/budget de un proyecto). */
export function paidPaymentsTotal(payments: Payment[]): number {
  return round(
    payments.filter((payment) => payment.status === 'pagado').reduce((sum, p) => sum + p.amount, 0),
  );
}

export interface PaymentCurrencyTotal {
  currency: string;
  paid: number;
  pending: number;
}

/**
 * Totales de cobros agrupados por moneda (no se mezclan monedas distintas).
 */
export function paymentTotalsByCurrency(payments: Payment[]): PaymentCurrencyTotal[] {
  const map = new Map<string, PaymentCurrencyTotal>();

  for (const payment of payments) {
    const currency = payment.currency.toUpperCase();
    const entry = map.get(currency) ?? { currency, paid: 0, pending: 0 };
    if (payment.status === 'pagado') {
      entry.paid += payment.amount;
    } else {
      entry.pending += payment.amount;
    }
    map.set(currency, entry);
  }

  return [...map.values()].map((entry) => ({
    currency: entry.currency,
    paid: round(entry.paid),
    pending: round(entry.pending),
  }));
}
