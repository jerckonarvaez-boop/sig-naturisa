// Reglas del calendario de eventos (fechas en texto AAAA-MM-DD, ver utils/fechas.ts)
import { fechaCorta, hoyISO } from '@/utils/fechas';
import type { Evento, EstadoVisual } from '../types';

/** "20 oct 2026" o "20 oct 2026 – 22 oct 2026" */
export const rangoFechas = (e: Pick<Evento, 'fechaInicio' | 'fechaFin'>) =>
  e.fechaFin ? `${fechaCorta(e.fechaInicio)} – ${fechaCorta(e.fechaFin)}` : fechaCorta(e.fechaInicio);

export const fechaFinal = (e: Pick<Evento, 'fechaInicio' | 'fechaFin'>) => e.fechaFin ?? e.fechaInicio;

/** ¿El evento ocupa ese día? */
/** Campamentos / centros de costo del evento (se guardan separados por coma) */
export const campamentosDe = (e: Pick<Evento, 'sucursal'>) =>
  e.sucursal
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** "Fincacua", "Fincacua y Kamaclusa", "Fincacua, Kamaclusa y 3 más" (para espacios cortos) */
export function campamentosCorto(e: Pick<Evento, 'sucursal'>, max = 2) {
  const l = campamentosDe(e);
  if (l.length <= max) return l.length === 2 ? `${l[0]} y ${l[1]}` : (l[0] ?? '');
  return `${l.slice(0, max).join(', ')} y ${l.length - max} más`;
}

export const cubreDia = (e: Evento, iso: string) => e.fechaInicio <= iso && iso <= fechaFinal(e);

/** Estado a mostrar: un evento programado cuya fecha ya pasó se considera vencido */
export function estadoVisual(e: Evento, hoy = hoyISO()): EstadoVisual {
  const pendiente = e.estado === 'programado' || e.estado === 'reprogramado';
  return pendiente && fechaFinal(e) < hoy ? 'vencido' : e.estado;
}

/** Programado o reprogramado, con fecha de hoy en adelante */
export const esProximo = (e: Evento, hoy = hoyISO()) =>
  (e.estado === 'programado' || e.estado === 'reprogramado') && fechaFinal(e) >= hoy;

/** Grupos del calendario: próximos y vencidos (más cercanos primero), realizados y todos (más recientes primero) */
export function agruparEventos(eventos: Evento[], hoy = hoyISO()) {
  const porFechaAsc = (a: Evento, b: Evento) => a.fechaInicio.localeCompare(b.fechaInicio);
  const porFechaDesc = (a: Evento, b: Evento) => b.fechaInicio.localeCompare(a.fechaInicio);
  return {
    proximos: eventos.filter((e) => esProximo(e, hoy)).sort(porFechaAsc),
    vencidos: eventos.filter((e) => estadoVisual(e, hoy) === 'vencido').sort(porFechaAsc),
    realizados: eventos.filter((e) => e.estado === 'realizado').sort(porFechaDesc),
    todos: [...eventos].sort(porFechaDesc),
  };
}

export type GruposEventos = ReturnType<typeof agruparEventos>;

/** Responsables ya usados, para sugerirlos en el formulario (las sucursales salen del presupuesto) */
export function sugerenciasDe(eventos: Evento[]) {
  const unicos = (valores: string[]) => [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  return {
    responsables: unicos(eventos.map((e) => e.responsable)),
  };
}
