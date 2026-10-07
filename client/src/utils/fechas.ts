// Utilidades de fechas. Las fechas se manejan como texto AAAA-MM-DD (hora local)
// para evitar desfases por zona horaria.

export const aISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function deISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const hoyISO = () => aISO(new Date());

/** Semanas (de lunes a domingo) que cubren el mes indicado (mes: 0-11) */
export function semanasDelMes(anio: number, mes: number): Date[][] {
  const primero = new Date(anio, mes, 1);
  const inicio = new Date(anio, mes, 1 - ((primero.getDay() + 6) % 7));
  const semanas: Date[][] = [];
  const dia = new Date(inicio);
  do {
    const semana: Date[] = [];
    for (let i = 0; i < 7; i++) {
      semana.push(new Date(dia));
      dia.setDate(dia.getDate() + 1);
    }
    semanas.push(semana);
  } while (dia.getMonth() === mes);
  return semanas;
}

/** "20 oct 2026" */
export const fechaCorta = (iso: string) =>
  deISO(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

/** AAAA-MM-DD -> DD/MM/AAAA (tablas con muchas filas) */
export function fechaNumerica(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Fecha larga en español: "Martes 6 de octubre de 2026" */
export function formatLongDate(date: Date): string {
  const text = date.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return text.charAt(0).toUpperCase() + text.slice(1).replace(',', '');
}

/** Días desde hoy hasta la fecha (negativo si ya pasó) */
export const diasHasta = (iso: string) => Math.round((deISO(iso).getTime() - deISO(hoyISO()).getTime()) / 864e5);

/** "Hoy", "Mañana", "En 5 días", "Hace 3 días" */
export function textoRelativo(iso: string): string {
  const d = diasHasta(iso);
  if (d === 0) return 'Hoy';
  if (d === 1) return 'Mañana';
  if (d === -1) return 'Ayer';
  return d > 0 ? `En ${d} días` : `Hace ${-d} días`;
}
