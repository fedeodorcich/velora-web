export type ClientStatus = 'lead' | 'activo' | 'inactivo';

/** Cliente perteneciente a un usuario (freelancer). */
export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  /** CUIT/CUIL opcional (texto libre, hasta 20 caracteres). */
  cuilCuit: string | null;
  currency: string;
  notes: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

/** Datos enviados al crear o actualizar un cliente. */
export interface ClientPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  cuilCuit?: string;
  currency?: string;
  notes?: string;
  status?: ClientStatus;
}

export interface ClientStatusOption {
  value: ClientStatus;
  label: string;
}

export const CLIENT_STATUS_OPTIONS: readonly ClientStatusOption[] = [
  { value: 'lead', label: 'Prospecto' },
  { value: 'activo', label: 'Activo' },
  { value: 'inactivo', label: 'Inactivo' },
];

export function clientStatusLabel(status: ClientStatus): string {
  const option = CLIENT_STATUS_OPTIONS.find((item) => item.value === status);
  return option ? option.label : status;
}

/** Monedas más habituales para un freelancer (código ISO 4217 + etiqueta). */
export interface CurrencyOption {
  value: string;
  label: string;
}

export const CURRENCY_OPTIONS: readonly CurrencyOption[] = [
  { value: 'USD', label: 'USD — Dólar estadounidense' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'MXN', label: 'MXN — Peso mexicano' },
  { value: 'COP', label: 'COP — Peso colombiano' },
  { value: 'CLP', label: 'CLP — Peso chileno' },
  { value: 'BRL', label: 'BRL — Real brasileño' },
  { value: 'GBP', label: 'GBP — Libra esterlina' },
];

export const DEFAULT_CURRENCY = 'USD';
