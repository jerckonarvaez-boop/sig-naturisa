// Nombres de meses y días en español (única fuente para toda la app)

/** "Enero" … "Diciembre" (títulos del calendario) */
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** "enero" … "diciembre" (filtros y textos en minúscula) */
export const MESES_LARGO = MESES.map((m) => m.toLowerCase());

/** Semana de lunes a domingo */
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
