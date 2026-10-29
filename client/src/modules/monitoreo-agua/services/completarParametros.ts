// Completa los parámetros de resultados ya guardados con lo que dice su PDF del laboratorio: agrega los que faltan y
// llena los que quedaron vacíos. Nunca cambia un valor que ya tiene dato.
import { leerInformeLaboratorio } from '../logic/lecturaPdf';
import type { Resultado, ValorParametro } from '../types';
import { actualizarResultado, urlPdf } from './monitoreo.api';
import { textoDePdf } from './pdfjs';

export interface Completado {
  resultado: Resultado;
  agregados: ValorParametro[];
}

/** Valores del resultado con lo que trae el PDF; agregados = lo nuevo (vacío si no hay nada que completar) */
export function completarValores(actuales: ValorParametro[], delPdf: ValorParametro[]) {
  const agregados = delPdf.filter((p) => !actuales.some((v) => v.clave === p.clave && v.valor.trim()));
  const valores = [
    ...actuales.map((v) => (v.valor.trim() ? v : (agregados.find((a) => a.clave === v.clave) ?? v))),
    ...agregados.filter((a) => !actuales.some((v) => v.clave === a.clave)),
  ];
  return { valores, agregados };
}

/** Revisa el PDF de cada resultado y guarda los que cambian; avisa el avance (hechos de total) */
export async function completarDesdePdf(resultados: Resultado[], alAvanzar: (hechos: number) => void): Promise<{ completados: Completado[]; errores: string[] }> {
  const completados: Completado[] = [];
  const errores: string[] = [];
  for (const [i, r] of resultados.entries()) {
    try {
      const res = await fetch(urlPdf(r.id), { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`no se pudo abrir el PDF (${res.status})`);
      const lectura = leerInformeLaboratorio(await textoDePdf(await res.blob()));
      if (lectura) {
        const { valores, agregados } = completarValores(r.valores, lectura.valores);
        if (agregados.length) completados.push({ resultado: await actualizarResultado(r.id, { ...r, valores }), agregados });
      }
    } catch (e) {
      errores.push(`${r.codigo || `#${r.id}`}: ${(e as Error).message}`);
    }
    alAvanzar(i + 1);
  }
  return { completados, errores };
}
