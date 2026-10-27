import { environment } from '../../../environments/environment';

/**
 * URL base de la API REST (NestJS) expuesta con prefijo global `/api`.
 * Se define en `src/environments/`: desarrollo apunta a localhost y el build
 * de producción lo reemplaza por el backend publicado.
 */
export const API_BASE_URL = environment.apiBaseUrl;
