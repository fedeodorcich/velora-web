/**
 * Usuario autenticado tal como lo expone el backend (sin datos sensibles).
 */
export interface User {
  id: string;
  email: string;
  name: string;
}
