// Configuración centralizada leída de variables de entorno (.env)
export const env = {
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? 'data/sig.db',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  /** Puerto de la web (Vite), para mostrar la dirección de acceso desde el móvil */
  webPort: Number(process.env.WEB_PORT ?? 5173),
  /** Servicio de seguridad del portal Naturisa que valida usuario y contraseña */
  authUrl: process.env.AUTH_URL ?? 'https://gateway.naturisa.com.ec/bff/web/portal/security/api/auth',
  /**
   * Código de aplicación que el servicio exige ("codeApplication"). Por defecto, el del
   * Portal de Compras; si TI registra uno propio para el SIG, se cambia aquí o en AUTH_APP_CODE.
   */
  authAppCode: process.env.AUTH_APP_CODE ?? 'cbe2cd96-cdc5-4bd9-bc6e-b7d6a822e656',
  /** true = no pedir inicio de sesión (solo para desarrollo) */
  authDisabled: process.env.AUTH_DISABLED === 'true',
  /**
   * Clave para firmar las sesiones. En producción debe definirse; si falta, se guarda una
   * generada junto a la base de datos para que las sesiones sobrevivan a los reinicios.
   */
  sessionSecret: process.env.SESSION_SECRET ?? '',
  /**
   * Clave para descifrar los datos iniciales (server/semillas). Con ella, al arrancar con la base
   * de datos vacía (ej. plan gratuito de Render) se cargan solos los datos del presupuesto.
   */
  semillaClave: process.env.SEMILLA_CLAVE ?? '',
};
