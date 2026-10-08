import { db, transaction } from '../../db/database.js';
import type {
  Gasto,
  ImportarPresupuestoBody,
  Importacion,
  PresupuestoData,
} from './presupuesto.types.js';

const texto = (v: unknown) => (v == null ? '' : String(v));

export function obtenerPresupuesto(): PresupuestoData {
  const gastos = db
    .prepare(
      `SELECT fecha_solped, area, subarea, cluster, sucursal, nota_general, item, nota_posicion,
              estado, solped, proveedor, cantidad, precio_unitario, total, oc_erp, fecha_oc
       FROM presupuesto_gasto ORDER BY id`,
    )
    .all()
    .map(
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

  const presupuestoArea = db
    .prepare('SELECT area, monto FROM presupuesto_area ORDER BY rowid')
    .all()
    .map((r) => ({ area: texto(r.area), monto: Number(r.monto) }));

  const presupuestoSubarea = db
    .prepare('SELECT area, subarea, monto FROM presupuesto_subarea ORDER BY rowid')
    .all()
    .map((r) => ({ area: texto(r.area), subarea: texto(r.subarea), monto: Number(r.monto) }));

  const ultima = db
    .prepare('SELECT archivo, registros, importado_en FROM presupuesto_importacion ORDER BY id DESC LIMIT 1')
    .get();
  const importacion: Importacion | null = ultima
    ? { archivo: texto(ultima.archivo), registros: Number(ultima.registros), importadoEn: texto(ultima.importado_en) }
    : null;

  return { importacion, gastos, presupuestoArea, presupuestoSubarea };
}

/**
 * Reemplaza todos los datos del presupuesto por los de la nueva importación.
 * `importadoEn` (opcional) conserva la fecha de una importación anterior (datos iniciales).
 */
export function importarPresupuesto(data: ImportarPresupuestoBody, importadoEn?: string): Importacion {
  return transaction(() => {
    db.exec('DELETE FROM presupuesto_gasto; DELETE FROM presupuesto_area; DELETE FROM presupuesto_subarea;');

    const insertarGasto = db.prepare(
      `INSERT INTO presupuesto_gasto (fecha_solped, area, subarea, cluster, sucursal, nota_general, item,
         nota_posicion, estado, solped, proveedor, cantidad, precio_unitario, total, oc_erp, fecha_oc)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const g of data.gastos) {
      insertarGasto.run(
        g.fechaSolped || null, g.area, g.subarea, g.cluster, g.sucursal, g.notaGeneral, g.item,
        g.notaPosicion, g.estado, g.solped, g.proveedor, g.cantidad, g.precioUnitario, g.total,
        g.ocErp, g.fechaOc || null,
      );
    }

    // Si el Excel repite un área o sub-área, se suman sus montos
    const insertarArea = db.prepare(
      'INSERT INTO presupuesto_area (area, monto) VALUES (?, ?) ON CONFLICT(area) DO UPDATE SET monto = monto + excluded.monto',
    );
    for (const p of data.presupuestoArea) insertarArea.run(p.area, p.monto);

    const insertarSubarea = db.prepare(
      `INSERT INTO presupuesto_subarea (area, subarea, monto) VALUES (?, ?, ?)
       ON CONFLICT(area, subarea) DO UPDATE SET monto = monto + excluded.monto`,
    );
    for (const p of data.presupuestoSubarea) insertarSubarea.run(p.area, p.subarea, p.monto);

    db.prepare(
      `INSERT INTO presupuesto_importacion (archivo, registros, importado_en)
       VALUES (?, ?, COALESCE(?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now')))`,
    ).run(data.archivo, data.gastos.length, importadoEn ?? null);

    return obtenerPresupuesto().importacion!;
  });
}
