import { esFecha, esUnoDe, texto, type Validado } from '../../utils/validacion.js';
import { camposDelTipo, SECCIONES, tiposDelInforme, type SeccionId, type SeccionLab } from './laboratorio.secciones.js';
import type { InformeDatos, MuestraLab, ValorLab } from './laboratorio.types.js';

const SECCIONES_IDS = Object.keys(SECCIONES) as SeccionId[];
const MAX_MUESTRAS = 60;

/**
 * Valida un informe contra la definición vigente (`secciones`, con los parámetros editados en Configuración;
 * los quitados siguen aceptándose para no perder sus valores al editar un informe antiguo).
 */
export function validarInforme(body: Record<string, unknown> | undefined, secciones: Record<SeccionId, SeccionLab> = SECCIONES): Validado<InformeDatos> {
  if (!body) return { error: 'Faltan los datos del informe.' };
  if (!esUnoDe(SECCIONES_IDS, body.seccion)) return { error: 'Sección de laboratorio no válida.' };
  const seccion = secciones[body.seccion];
  const tipos = tiposDelInforme(seccion, body.tipo);
  if (!tipos) return { error: 'Tipo de informe no válido.' };
  const tipo = tipos.map((t) => t.id).join('+'); // en el orden de la definición
  const unaMuestra = tipos.find((t) => t.unaMuestra);

  const codigo = texto(body.codigo, 80);
  if (!codigo) return { error: 'Indique el código del informe.' };
  if (!esFecha(body.fechaEmision)) return { error: 'La fecha de emisión no es válida.' };
  const fechaMuestra = body.fechaMuestra ? body.fechaMuestra : '';
  if (fechaMuestra && !esFecha(fechaMuestra)) return { error: `La ${seccion.etiquetaFechaMuestra.toLowerCase()} no es válida.` };
  const sucursal = texto(body.sucursal, 120);
  if (!sucursal) return { error: 'Indique la identificación de la muestra (centro de costo o cliente).' };

  if (!Array.isArray(body.muestras) || !body.muestras.length) return { error: 'Agregue al menos una muestra.' };
  if (body.muestras.length > MAX_MUESTRAS) return { error: `Máximo ${MAX_MUESTRAS} muestras por informe.` };
  if (unaMuestra && body.muestras.length !== 1) return { error: `El tipo "${unaMuestra.nombre}" lleva una sola muestra.` };

  // Parámetros químicos elegidos para este informe (solo Análisis de Agua con químico); los demás no se guardan
  let parametros: string[] | null = null;
  const quimicos = seccion.campos.filter((c) => c.grupo === 'quimica');
  if (quimicos.length && tipo.split('+').includes('quimico') && body.parametros != null) {
    if (!Array.isArray(body.parametros)) return { error: 'La lista de parámetros químicos no es válida.' };
    parametros = [...new Set(body.parametros.filter((c): c is string => typeof c === 'string'))];
    const desconocido = parametros.find((c) => !quimicos.some((q) => q.clave === c));
    if (desconocido) return { error: `El parámetro químico "${desconocido}" no existe; actualice la página.` };
  }
  const fuera = new Set(parametros ? quimicos.filter((q) => !parametros!.includes(q.clave)).map((q) => q.clave) : []);
  const campos = new Map(camposDelTipo(seccion, tipo).filter((c) => !fuera.has(c.clave)).map((c) => [c.clave, c]));
  const muestras: MuestraLab[] = [];
  for (const [i, m] of (body.muestras as Record<string, unknown>[]).entries()) {
    const nombre = texto(m?.nombre, 40);
    if (!nombre) return { error: `Falta el nombre de la ${seccion.etiquetaMuestra.toLowerCase()} ${i + 1}.` };
    const entrada = m?.valores && typeof m.valores === 'object' ? (m.valores as Record<string, unknown>) : {};
    const valores: Record<string, ValorLab> = {};
    for (const [clave, valor] of Object.entries(entrada)) {
      const campo = campos.get(clave);
      if (!campo || valor === null || valor === '') continue; // parámetros de otro tipo o vacíos se descartan
      if (campo.tipo === 'numero') {
        if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
          return { error: `"${campo.etiqueta}" de ${nombre} debe ser un número mayor o igual a 0.` };
        }
        valores[clave] = valor;
      } else {
        const t = texto(valor, 500);
        if (t) valores[clave] = t;
      }
    }
    muestras.push({ nombre, valores });
  }

  return {
    datos: {
      seccion: seccion.id,
      tipo,
      codigo,
      fechaEmision: body.fechaEmision,
      fechaMuestra: fechaMuestra as string,
      sucursal,
      matriz: texto(body.matriz, 120),
      muestreadoPor: texto(body.muestreadoPor, 120),
      analisis: texto(body.analisis, 200),
      tecnico: texto(body.tecnico, 120),
      observaciones: texto(body.observaciones, 4000),
      parametros,
      muestras,
    },
  };
}
