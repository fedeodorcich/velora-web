/**
 * Datos públicos del prestador. Completar con la información confirmada por el titular.
 * El aviso preliminar se mantiene mientras falte identificación, domicilio o correo.
 */
export const LEGAL_CONTACT = {
  providerName: '',
  taxId: '',
  address: '',
  supportEmail: '',
} as const;

export const LEGAL_CONTACT_READY = Boolean(
  LEGAL_CONTACT.providerName && LEGAL_CONTACT.address && LEGAL_CONTACT.supportEmail,
);
