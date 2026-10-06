// Datos generales de la aplicación. Edita aquí nombre, subtítulo y logo.
export const APP_CONFIG = {
  company: 'Naturisa',
  name: 'SIG',
  subtitle: 'Sistema Integrado de Gestión',
  /** Ruta a un logo en client/public (ej. '/logo-naturisa.png'). null = logo de texto. */
  logoUrl: '/logo-naturisa.png' as string | null,
};

// Usuario de prueba mientras no exista autenticación (se reemplazará en una fase posterior)
export const DEMO_USER = {
  name: 'Usuario Demo',
  role: 'Administrador',
};
