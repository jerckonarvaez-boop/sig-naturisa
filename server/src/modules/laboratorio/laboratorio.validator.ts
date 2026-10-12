import { esFecha, esUnoDe, texto, type Validado } from '../../utils/validacion.js';
import { camposDelTipo, SECCIONES, type SeccionId } from './laboratorio.secciones.js';
import type { InformeDatos, MuestraLab, ValorLab } from './laboratorio.types.js';

const SECCIONES_IDS = Object.keys(SECCIONES) as SeccionId[];
const MAX_MUESTRAS = 60;

export function validarInforme(body: Record<string, unknown> | undefined): Validado<InformeDatos> {
  if (!body) return { error: 'Faltan los datos del informe.' };
  if (!esUnoDe(SECCIONES_IDS, body.seccion)) return { error: 'Sección de laboratorio no válida.' };
  const seccion = SECCIONES[body.seccion];
  const tipo = seccion.tipos.find((t) => t.id === body.tipo);
  if (!tipo) return { error: 'Tipo de informe no válido.' };

  const codigo = texto(body.codigo, 80);
  if (!codigo) return { error: 'Indique el código del informe.' };
  if (!esFecha(body.fechaEmision)) return { error: 'La fecha de emisión no es válida.' };
  const fechaMuestra = body.fechaMuestra ? body.fechaMuestra : '';
  if (fechaMuestra && !esFecha(fechaMuestra)) return { error: `La ${seccion.etiquetaFechaMuestra.toLowerCase()} no es válida.` };
  const sucursal = texto(body.sucursal, 120);
  if (!sucursal) return { error: 'Indique la identificación de la muestra (centro de costo o cliente).' };

  if (!Array.isArray(body.muestras) || !body.muestras.length) return { error: 'Agregue al menos una muestra.' };
  if (body.muestras.length > MAX_MUESTRAS) return { error: `Máximo ${MAX_MUESTRAS} muestras por informe.` };
  if (tipo.unaMuestra && body.muestras.length !== 1) return { error: `El tipo "${tipo.nombre}" lleva una sola muestra.` };

  const campos = new Map(camposDelTipo(seccion, tipo.id).map((c) => [c.clave, c]));
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
      tipo: tipo.id,
      codigo,
      fechaEmision: body.fechaEmision,
      fechaMuestra: fechaMuestra as string,
      sucursal,
      matriz: texto(body.matriz, 120),
      muestreadoPor: texto(body.muestreadoPor, 120),
      analisis: texto(body.analisis, 200),
      tecnico: texto(body.tecnico, 120),
      observaciones: texto(body.observaciones, 4000),
      muestras,
    },
  };
}
