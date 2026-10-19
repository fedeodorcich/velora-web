import {
  Payment,
  formatPaymentNumber,
  isOverdue,
  paymentDisplayStatus,
  paymentTotalsByCurrency,
} from './payment.model';

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'payment-1',
    userId: 'user-1',
    projectId: 'project-1',
    number: 1,
    concept: 'Anticipo',
    amount: 100,
    currency: 'USD',
    dueDate: '2026-11-01',
    status: 'pendiente',
    paidAt: null,
    method: null,
    notes: null,
    createdAt: '2026-10-15T00:00:00.000Z',
    updatedAt: '2026-10-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('formatPaymentNumber', () => {
  it('formatea el correlativo como COB-0001', () => {
    expect(formatPaymentNumber(1)).toBe('COB-0001');
    expect(formatPaymentNumber(42)).toBe('COB-0042');
  });
});

describe('isOverdue', () => {
  it('es verdadero para un cobro pendiente cuyo vencimiento ya pasó', () => {
    expect(isOverdue(payment({ dueDate: '2026-10-01' }), '2026-10-15')).toBe(true);
  });

  it('es falso si el vencimiento es hoy o futuro', () => {
    expect(isOverdue(payment({ dueDate: '2026-10-15' }), '2026-10-15')).toBe(false);
    expect(isOverdue(payment({ dueDate: '2026-12-01' }), '2026-10-15')).toBe(false);
  });

  it('es falso si el cobro ya está pagado', () => {
    expect(
      isOverdue(payment({ dueDate: '2026-10-01', status: 'pagado' }), '2026-10-15'),
    ).toBe(false);
  });
});

describe('paymentDisplayStatus', () => {
  it('devuelve pagado cuando el cobro está pagado', () => {
    expect(paymentDisplayStatus(payment({ status: 'pagado' }), '2026-10-15')).toBe('pagado');
  });

  it('devuelve vencido cuando está pendiente y vencido', () => {
    expect(paymentDisplayStatus(payment({ dueDate: '2026-10-01' }), '2026-10-15')).toBe('vencido');
  });

  it('devuelve pendiente cuando está pendiente y no vencido', () => {
    expect(paymentDisplayStatus(payment({ dueDate: '2026-12-01' }), '2026-10-15')).toBe(
      'pendiente',
    );
  });
});

describe('paymentTotalsByCurrency', () => {
  it('agrupa los totales por moneda y separa cobrado de pendiente', () => {
    const result = paymentTotalsByCurrency([
      payment({ id: 'p1', currency: 'USD', amount: 100, status: 'pagado' }),
      payment({ id: 'p2', currency: 'USD', amount: 50, status: 'pendiente' }),
      payment({ id: 'p3', currency: 'EUR', amount: 200, status: 'pagado' }),
    ]);

    expect(result).toEqual([
      { currency: 'USD', paid: 100, pending: 50 },
      { currency: 'EUR', paid: 200, pending: 0 },
    ]);
  });

  it('devuelve una lista vacía si no hay cobros', () => {
    expect(paymentTotalsByCurrency([])).toEqual([]);
  });
});
