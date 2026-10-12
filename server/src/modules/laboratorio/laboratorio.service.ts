import type { InStatement } from '@libsql/client';
import { consultar, consultarUna, ejecutar, lote, transaction, type Fila } from '../../db/database.js';
import type { SeccionId } from './laboratorio.secciones.js';
import type { Informe, InformeDatos, InformeResumen, MuestraLab } from './laboratorio.types.js';

const COLUMNAS = `id, seccion, tipo, codigo, fecha_emision, fecha_muestra, sucursal, matriz, muestreado_por, analisis,
                  tecnico, observaciones, creado_en, actualizado_en`;

function aInforme(r: Fila): Omit<Informe, 'muestras'> {
  return {
    id: Number(r.id),
    seccion: String(r.seccion) as SeccionId,
    tipo: String(r.tipo),
    codigo: String(r.codigo),
    fechaEmision: String(r.fecha_emision),
    fechaMuestra: String(r.fecha_muestra ?? ''),
    sucursal: String(r.sucursal ?? ''),
    matriz: String(r.matriz ?? ''),
    muestreadoPor: String(r.muestreado_por ?? ''),
    analisis: String(r.analisis ?? ''),
    tecnico: String(r.tecnico ?? ''),
    observaciones: String(r.observaciones ?? ''),
    creadoEn: String(r.creado_en),
    actualizadoEn: String(r.actualizado_en),
  };
}

const valoresDe = (texto: unknown): MuestraLab['valores'] => {
  try {
    const v = JSON.parse(String(texto ?? '{}'));
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
};

/** Informes de una sección, del más reciente al más antiguo, con los nombres de sus muestras */
export async function listarInformes(seccion: SeccionId): Promise<InformeResumen[]> {
  const [filas, muestras] = await Promise.all([
    consultar(`SELECT ${COLUMNAS} FROM lab_informe WHERE seccion = ? ORDER BY fecha_emision DESC, id DESC`, [seccion]),
    consultar(
      `SELECT m.informe_id, m.nombre FROM lab_muestra m JOIN lab_informe i ON i.id = m.informe_id
       WHERE i.seccion = ? ORDER BY m.informe_id, m.orden`,
      [seccion],
    ),
  ]);
  const porInforme = new Map<number, string[]>();
  for (const m of muestras) {
    const id = Number(m.informe_id);
    porInforme.set(id, [...(porInforme.get(id) ?? []), String(m.nombre)]);
  }
  return filas.map((f) => ({ ...aInforme(f), muestras: porInforme.get(Number(f.id)) ?? [] }));
}

export async function obtenerInforme(id: number): Promise<Informe | null> {
  const [fila, muestras] = await Promise.all([
    consultarUna(`SELECT ${COLUMNAS} FROM lab_informe WHERE id = ?`, [id]),
    consultar('SELECT nombre, valores FROM lab_muestra WHERE informe_id = ? ORDER BY orden', [id]),
  ]);
  if (!fila) return null;
  return { ...aInforme(fila), muestras: muestras.map((m) => ({ nombre: String(m.nombre), valores: valoresDe(m.valores) })) };
}

const encabezado = (d: InformeDatos) => [
  d.seccion, d.tipo, d.codigo, d.fechaEmision, d.fechaMuestra, d.sucursal, d.matriz, d.muestreadoPor, d.analisis,
  d.tecnico, d.observaciones,
];

/** Sentencias que reemplazan las muestras del informe */
function sentenciasMuestras(informeId: number, muestras: MuestraLab[]): InStatement[] {
  return [
    { sql: 'DELETE FROM lab_muestra WHERE informe_id = ?', args: [informeId] },
    ...muestras.map((m, i) => ({
      sql: 'INSERT INTO lab_muestra (informe_id, orden, nombre, valores) VALUES (?, ?, ?, ?)',
      args: [informeId, i, m.nombre, JSON.stringify(m.valores)],
    })),
  ];
}

export async function crearInforme(d: InformeDatos): Promise<Informe> {
  const id = await transaction(async (tx) => {
    const { id: nuevoId } = await ejecutar(
      `INSERT INTO lab_informe (seccion, tipo, codigo, fecha_emision, fecha_muestra, sucursal, matriz, muestreado_por,
         analisis, tecnico, observaciones) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      encabezado(d),
      tx,
    );
    await lote(sentenciasMuestras(nuevoId, d.muestras), tx);
    return nuevoId;
  });
  return (await obtenerInforme(id))!;
}

export async function actualizarInforme(id: number, d: InformeDatos): Promise<Informe | null> {
  const existe = await transaction(async (tx) => {
    const { cambios } = await ejecutar(
      `UPDATE lab_informe SET seccion = ?, tipo = ?, codigo = ?, fecha_emision = ?, fecha_muestra = ?, sucursal = ?,
         matriz = ?, muestreado_por = ?, analisis = ?, tecnico = ?, observaciones = ?,
         actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
       WHERE id = ?`,
      [...encabezado(d), id],
      tx,
    );
    if (cambios) await lote(sentenciasMuestras(id, d.muestras), tx);
    return cambios > 0;
  });
  return existe ? obtenerInforme(id) : null;
}

/** Elimina el informe con sus muestras (todo o nada) */
export async function eliminarInforme(id: number): Promise<boolean> {
  const afectadas = await lote([
    { sql: 'DELETE FROM lab_muestra WHERE informe_id = ?', args: [id] },
    { sql: 'DELETE FROM lab_informe WHERE id = ?', args: [id] },
  ]);
  return afectadas[1] > 0;
}
