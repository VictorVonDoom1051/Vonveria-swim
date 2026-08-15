export const SESSION_COOKIE_NAME = "vonveria_session";
export const CSRF_COOKIE_NAME = "vonveria_csrf";

/**
 * Base que usa el navegador. Cuando web y api viven en dominios distintos
 * (Railway les da un subdominio a cada uno) tiene que ser una ruta relativa
 * como "/api", servida por el rewrite de next.config.mjs: el patron de doble
 * cookie CSRF exige que el navegador vea un unico origen, porque document.cookie
 * no puede leer una cookie emitida por otro dominio.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Base para las llamadas desde el servidor de Next y para el proxy de
 * app/api/[...path]. Siempre tiene que ser absoluta, por eso no cae a API_URL:
 * en produccion esa es relativa.
 */
export const API_SERVER_URL = process.env.API_SERVER_URL ?? "http://localhost:3001";
