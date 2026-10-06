// Configuración centralizada leída de variables de entorno (.env)
export const env = {
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? 'data/sig.db',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  /** Puerto de la web (Vite), para mostrar la dirección de acceso desde el móvil */
  webPort: Number(process.env.WEB_PORT ?? 5173),
};
