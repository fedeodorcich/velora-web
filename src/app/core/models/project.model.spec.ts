import { Project, approvedQuotesWithoutProject } from './project.model';
import { Quote, QuoteStatus } from './quote.model';

function quote(id: string, status: QuoteStatus = 'aceptado'): Quote {
  return {
    id,
    userId: 'user-1',
    clientId: 'client-1',
    number: 1,
    title: 'Presupuesto',
    status,
    currency: 'USD',
    issueDate: '2026-10-15',
    validUntil: null,
    taxRate: 0,
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    notes: null,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };
}

function project(quoteId: string | null): Project {
  return {
    id: `project-${quoteId ?? 'x'}`,
    userId: 'user-1',
    clientId: 'client-1',
    quoteId,
    number: 1,
    name: 'Proyecto',
    status: 'planificado',
    currency: 'USD',
    budget: 0,
    progress: 0,
    startDate: null,
    dueDate: null,
    description: null,
    notes: null,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
  };
}

describe('approvedQuotesWithoutProject', () => {
  it('excluye los presupuestos que ya tienen proyecto', () => {
    const result = approvedQuotesWithoutProject(
      [quote('q1'), quote('q2'), quote('q3')],
      [project('q2')],
    );
    expect(result.map((item) => item.id)).toEqual(['q1', 'q3']);
  });

  it('excluye los presupuestos que no están aceptados', () => {
    const result = approvedQuotesWithoutProject(
      [quote('q1', 'aceptado'), quote('q2', 'borrador'), quote('q3', 'enviado')],
      [],
    );
    expect(result.map((item) => item.id)).toEqual(['q1']);
  });

  it('devuelve todos los aprobados si ningún proyecto tiene presupuesto', () => {
    const result = approvedQuotesWithoutProject([quote('q1'), quote('q2')], [project(null)]);
    expect(result.map((item) => item.id)).toEqual(['q1', 'q2']);
  });

  it('devuelve una lista vacía si no hay presupuestos', () => {
    expect(approvedQuotesWithoutProject([], [project('q1')])).toEqual([]);
  });
});
