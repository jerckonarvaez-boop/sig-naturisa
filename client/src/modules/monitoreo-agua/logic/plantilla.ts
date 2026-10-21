// Textos del informe PGC-025: los propios de cada camaronera (copiados de su Word) o, si están vacíos, los automáticos.
import type { ParametroMonitoreo, Resultado, Sitio, TextosInforme } from '../types';

/** "La empresa Naturisa S.A. – …" · "La Camaronera …" · "El Laboratorio de Larvas …" */
function sujetoAutomatico(nombre: string) {
  if (/^laboratorio/i.test(nombre)) return `El ${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`;
  if (/^(camaronera|empacadora)/i.test(nombre)) return `La ${nombre}`;
  return `La empresa ${nombre}`;
}

const SIN_IMPACTO = /se observa que no existe un impacto ambiental al agua marina\.?/i;

/** Textos con los que se abre una ficha nueva (los mismos que se usan si un texto queda vacío) */
export function textosAutomaticos(sitio: Pick<Sitio, 'nombre' | 'lugar'>): TextosInforme {
  const n = sitio.nombre;
  return {
    introduccion: sujetoAutomatico(n),
    objetivo: `Elaborar el Informe de Monitoreo del análisis de agua del efluente correspondiente a ${n}${
      sitio.lugar ? ` ubicado en ${sitio.lugar}` : ''
    } con la finalidad de verificar el cumplimiento de los parámetros ante la normativa ambiental vigente.`,
    alcance: `Aplica a los análisis de agua del efluente realizado para ${n}.`,
    resumen: `Los análisis de agua del Efluente de ${n} fueron realizados por Laboratorio {laboratorio}. Los cuales muestran los siguientes resultados:`,
    conclusion: `De acuerdo con los resultados obtenidos de los análisis efectuados por el Laboratorio {laboratorio}, correspondiente a ${n} y comparados con la normativa ambiental vigente (Acuerdo Ministerial 097a- Anexo 1. Recurso Agua), se observa que no existe un impacto ambiental al agua marina.`,
    tabla: `Resultados Análisis Efluentes - ${n}`,
  };
}

/** Textos finales del informe: los de la ficha (o automáticos), con el laboratorio y la conclusión según los resultados */
export function textosDelInforme(sitio: Sitio, resultado: Resultado, excedidos: ParametroMonitoreo[]) {
  const auto = textosAutomaticos(sitio);
  const laboratorio = resultado.laboratorio || 'externo';
  const t = (c: keyof TextosInforme) => (sitio.textos?.[c]?.trim() || auto[c]).replace(/\{laboratorio\}/g, laboratorio);

  let conclusion = t('conclusion');
  if (excedidos.length) {
    const nombres = excedidos.map((p) => p.nombre).join(', ');
    const frase = `se observa que ${excedidos.length === 1 ? 'el parámetro' : 'los parámetros'} ${nombres} ${
      excedidos.length === 1 ? 'supera' : 'superan'
    } el límite máximo permisible.`;
    conclusion = SIN_IMPACTO.test(conclusion) ? conclusion.replace(SIN_IMPACTO, frase) : `${conclusion} Sin embargo, ${frase}`;
  }

  return {
    titulo: sitio.tituloEncabezado?.trim() || sitio.nombre.toUpperCase(),
    introduccion: t('introduccion'),
    objetivo: t('objetivo'),
    alcance: t('alcance'),
    resumen: t('resumen'),
    conclusion,
    tabla: t('tabla'),
    laboratorio,
  };
}
