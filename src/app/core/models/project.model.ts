import { Client } from './client.model';
import { Quote } from './quote.model';

export type ProjectStatus =
  | 'planificado'
  | 'en_progreso'
  | 'pausado'
  | 'finalizado'
  | 'cancelado';

/** Proyecto (trabajo adjudicado) perteneciente a un usuario (freelancer). */
export interface Project {
  id: string;
  userId: string;
  clientId: string;
  /** Cliente destino; el backend lo incluye en listado y detalle. */
  client?: Client;
  /** Presupuesto de origen (opcional, único). */
  quoteId: string | null;
  number: number;
  name: string;
  status: ProjectStatus;
  currency: string;
  /** Monto acordado (base para los cobros). */
  budget: number;
  /** Progreso manual, de 0 a 100. */
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Datos enviados al crear un proyecto: solo el presupuesto de origen y los datos de gestión. */
export interface ProjectCreatePayload {
  quoteId: string;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  description?: string;
  notes?: string;
}

/**
 * Datos editables de un proyecto. El cliente y el presupuesto de origen no se
 * modifican (el cliente deriva del presupuesto); el estado se cambia aparte.
 */
export interface ProjectUpdatePayload {
  name?: string;
  currency?: string;
  budget?: number;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  description?: string;
  notes?: string;
}

export interface ProjectStatusOption {
  value: ProjectStatus;
  label: string;
}

export const PROJECT_STATUS_OPTIONS: readonly ProjectStatusOption[] = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function projectStatusLabel(status: ProjectStatus): string {
  const option = PROJECT_STATUS_OPTIONS.find((item) => item.value === status);
  return option ? option.label : status;
}

/** Formatea el correlativo interno (`1`) como código visible (`PRY-0001`). */
export function formatProjectNumber(number: number): string {
  return `PRY-${String(number).padStart(4, '0')}`;
}

/**
 * Devuelve los presupuestos **aprobados** (`aceptado`) que todavía **no** tienen un
 * proyecto asociado, para ofrecerlos como origen al crear un proyecto (la relación
 * es uno a uno y solo los aprobados se pueden convertir).
 */
export function approvedQuotesWithoutProject(quotes: Quote[], projects: Project[]): Quote[] {
  const takenQuoteIds = new Set(
    projects.map((project) => project.quoteId).filter((id): id is string => id !== null),
  );
  return quotes.filter((quote) => quote.status === 'aceptado' && !takenQuoteIds.has(quote.id));
}

/** Filete y color de texto para la etiqueta de estado del proyecto. */
export function projectStatusClass(status: ProjectStatus): string {
  switch (status) {
    case 'en_progreso':
      return 'border-info/50 text-info';
    case 'pausado':
      return 'border-amber/50 text-amber';
    case 'cancelado':
      return 'border-coral/50 text-coral';
    case 'finalizado':
      return 'border-ok/50 text-ok';
    default:
      return 'border-rule-strong text-ink-3';
  }
}
