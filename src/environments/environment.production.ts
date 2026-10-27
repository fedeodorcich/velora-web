/**
 * Configuración de producción (`ng build`).
 * Cambiar acá las URLs cuando el dominio y el backend estén publicados;
 * también hay que actualizar `index.html`, `robots.txt` y `sitemap.xml`.
 */
export const environment = {
  production: true,
  /** Backend en Render (servicio de la API). */
  apiBaseUrl: 'https://velora-api.onrender.com/api',
  /** Dominio público del frontend. */
  siteUrl: 'https://velora.app',
};
