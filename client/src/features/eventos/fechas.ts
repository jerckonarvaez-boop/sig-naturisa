// Utilidades de fechas del calendario. Las fechas se manejan como texto AAAA-MM-DD
// (hora local) para evitar desfases por zona horaria.
import type { Evento, EstadoVisual } from './types';

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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

/** "20 oct 2026" o "20 oct 2026 – 22 oct 2026" */
export const rangoFechas = (e: Pick<Evento, 'fechaInicio' | 'fechaFin'>) =>
  e.fechaFin ? `${fechaCorta(e.fechaInicio)} – ${fechaCorta(e.fechaFin)}` : fechaCorta(e.fechaInicio);

export const fechaFinal = (e: Pick<Evento, 'fechaInicio' | 'fechaFin'>) => e.fechaFin ?? e.fechaInicio;

/** ¿El evento ocupa ese día? */
export const cubreDia = (e: Evento, iso: string) => e.fechaInicio <= iso && iso <= fechaFinal(e);

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

/** Estado a mostrar: un evento programado cuya fecha ya pasó se considera vencido */
export function estadoVisual(e: Evento, hoy = hoyISO()): EstadoVisual {
  const pendiente = e.estado === 'programado' || e.estado === 'reprogramado';
  return pendiente && fechaFinal(e) < hoy ? 'vencido' : e.estado;
}

/** Programado o reprogramado, con fecha de hoy en adelante */
export const esProximo = (e: Evento, hoy = hoyISO()) =>
  (e.estado === 'programado' || e.estado === 'reprogramado') && fechaFinal(e) >= hoy;
