import { Client } from './client.model';

export type QuoteStatus = 'borrador' | 'enviado' | 'aceptado' | 'rechazado';

/** Línea de detalle de un presupuesto. */
export interface QuoteItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  position: number;
}

/** Presupuesto perteneciente a un usuario (freelancer). */
export interface Quote {
  id: string;
  userId: string;
  clientId: string;
  /** Cliente destino; el backend lo incluye en listado y detalle. */
  client?: Client;
  number: number;
  title: string;
  status: QuoteStatus;
  currency: string;
  issueDate: string;
  validUntil: string | null;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  /** Líneas; solo presentes en el detalle. */
  items?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

/** Línea enviada al crear o actualizar un presupuesto. */
export interface QuoteItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
}

/** Datos enviados al crear o actualizar un presupuesto. */
export interface QuotePayload {
  clientId: string;
  title: string;
  status?: QuoteStatus;
  currency?: string;
  issueDate?: string;
  validUntil?: string;
  taxRate?: number;
  notes?: string;
  items: QuoteItemPayload[];
}

export interface QuoteStatusOption {
  value: QuoteStatus;
  label: string;
}

export const QUOTE_STATUS_OPTIONS: readonly QuoteStatusOption[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aceptado', label: 'Aceptado' },
  { value: 'rechazado', label: 'Rechazado' },
];

export function quoteStatusLabel(status: QuoteStatus): string {
  const option = QUOTE_STATUS_OPTIONS.find((item) => item.value === status);
  return option ? option.label : status;
}

/** Formatea el correlativo interno (`1`) como código visible (`P-0001`). */
export function formatQuoteNumber(number: number): string {
  return `P-${String(number).padStart(4, '0')}`;
}

/** Filete y color de texto para la etiqueta de estado del presupuesto. */
export function quoteStatusClass(status: QuoteStatus): string {
  switch (status) {
    case 'aceptado':
      return 'border-cyan/40 text-cyan';
    case 'enviado':
      return 'border-amber/40 text-amber';
    case 'rechazado':
      return 'border-coral/40 text-coral';
    default:
      return 'border-rule-strong text-ink-3';
  }
}

/** Formatea un importe con la moneda del presupuesto, con fallback simple. */
export function formatAmount(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
