import type { InStatement } from '@libsql/client';
import { consultar, consultarUna, lote } from '../../db/database.js';
import type {
  CatalogoPresupuesto,
  Gasto,
  ImportarPresupuestoBody,
  Importacion,
  PresupuestoData,
} from './presupuesto.types.js';

const texto = (v: unknown) => (v == null ? '' : String(v));

async function ultimaImportacion(): Promise<Importacion | null> {
  const ultima = await consultarUna(
    'SELECT archivo, registros, importado_en FROM presupuesto_importacion ORDER BY id DESC LIMIT 1',
  );
  return ultima
    ? { archivo: texto(ultima.archivo), registros: Number(ultima.registros), importadoEn: texto(ultima.importado_en) }
    : null;
}

export async function obtenerPresupuesto(): Promise<PresupuestoData> {
  const [filasGastos, filasArea, filasSubarea, importacion] = await Promise.all([
    consultar(
      `SELECT fecha_solped, area, subarea, cluster, sucursal, nota_general, item, nota_posicion,
              estado, solped, proveedor, cantidad, precio_unitario, total, oc_erp, fecha_oc
       FROM presupuesto_gasto ORDER BY id`,
    ),
    consultar('SELECT area, monto FROM presupuesto_area ORDER BY rowid'),
    consultar('SELECT area, subarea, monto FROM presupuesto_subarea ORDER BY rowid'),
    ultimaImportacion(),
  ]);

  const gastos = filasGastos.map(
    (r): Gasto => ({
      fechaSolped: texto(r.fecha_solped),
      area: texto(r.area),
      subarea: texto(r.subarea),
      cluster: texto(r.cluster),
      sucursal: texto(r.sucursal),
      notaGeneral: texto(r.nota_general),
      item: texto(r.item),
      notaPosicion: texto(r.nota_posicion),
      estado: texto(r.estado),
      solped: texto(r.solped),
      proveedor: texto(r.proveedor),
      cantidad: Number(r.cantidad),
      precioUnitario: Number(r.precio_unitario),
      total: Number(r.total),
      ocErp: texto(r.oc_erp),
      fechaOc: texto(r.fecha_oc),
    }),
  );
  const presupuestoArea = filasArea.map((r) => ({ area: texto(r.area), monto: Number(r.monto) }));
  const presupuestoSubarea = filasSubarea.map((r) => ({
    area: texto(r.area),
    subarea: texto(r.subarea),
    monto: Number(r.monto),
  }));

  return { importacion, gastos, presupuestoArea, presupuestoSubarea };
}

/** ¿Hay datos de presupuesto cargados? */
export async function hayPresupuesto(): Promise<boolean> {
  return Boolean(await consultarUna('SELECT 1 FROM presupuesto_gasto LIMIT 1'));
}

/**
 * Reemplaza todos los datos del presupuesto por los de la nueva importación (todo o nada).
 * `importadoEn` (opcional) conserva la fecha de una importación anterior (datos iniciales).
 */
export async function importarPresupuesto(data: ImportarPresupuestoBody, importadoEn?: string): Promise<Importacion> {
  const sentencias: InStatement[] = [
    'DELETE FROM presupuesto_gasto',
    'DELETE FROM presupuesto_area',
    'DELETE FROM presupuesto_subarea',
  ];

  for (const g of data.gastos) {
    sentencias.push({
      sql: `INSERT INTO presupuesto_gasto (fecha_solped, area, subarea, cluster, sucursal, nota_general, item,
              nota_posicion, estado, solped, proveedor, cantidad, precio_unitario, total, oc_erp, fecha_oc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        g.fechaSolped || null, g.area, g.subarea, g.cluster, g.sucursal, g.notaGeneral, g.item,
        g.notaPosicion, g.estado, g.solped, g.proveedor, g.cantidad, g.precioUnitario, g.total,
        g.ocErp, g.fechaOc || null,
      ],
    });
  }

  // Si el Excel repite un área o sub-área, se suman sus montos
  for (const p of data.presupuestoArea) {
    sentencias.push({
      sql: 'INSERT INTO presupuesto_area (area, monto) VALUES (?, ?) ON CONFLICT(area) DO UPDATE SET monto = monto + excluded.monto',
      args: [p.area, p.monto],
    });
  }
  for (const p of data.presupuestoSubarea) {
    sentencias.push({
      sql: `INSERT INTO presupuesto_subarea (area, subarea, monto) VALUES (?, ?, ?)
            ON CONFLICT(area, subarea) DO UPDATE SET monto = monto + excluded.monto`,
      args: [p.area, p.subarea, p.monto],
    });
  }

  sentencias.push({
    sql: `INSERT INTO presupuesto_importacion (archivo, registros, importado_en)
          VALUES (?, ?, COALESCE(?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')))`,
    args: [data.archivo, data.gastos.length, importadoEn ?? null],
  });

  await lote(sentencias);
  return (await ultimaImportacion())!;
}

/** Centros de costo (sucursales) del presupuesto, para las listas validadas de otros módulos */
export async function obtenerCatalogo(): Promise<CatalogoPresupuesto> {
  const filas = await consultar(`SELECT DISTINCT sucursal FROM presupuesto_gasto WHERE sucursal <> '' ORDER BY sucursal`);
  return { centrosCosto: filas.map((r) => texto(r.sucursal).trim()).filter(Boolean) };
}
