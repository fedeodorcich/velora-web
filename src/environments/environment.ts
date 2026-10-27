/**
 * Configuración de desarrollo (`ng serve`).
 * El build de producción reemplaza este archivo por `environment.production.ts`
 * (ver `fileReplacements` en `angular.json`).
 */
export const environment = {
  production: false,
  /** Origen del backend NestJS, con el prefijo global `/api`. */
  apiBaseUrl: 'http://localhost:3000/api',
  /** Origen público del frontend (metadatos y enlaces absolutos). */
  siteUrl: 'http://localhost:4200',
};
