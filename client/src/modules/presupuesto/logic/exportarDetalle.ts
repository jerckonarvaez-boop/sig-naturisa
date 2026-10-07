import { descargarCsv } from '@/utils/csv';
import type { Registro } from '../types';

/** Exporta el detalle de gastos (en el orden mostrado) a CSV para Excel */
export function exportarDetalleCsv(registros: Registro[]) {
  const cabecera = [
    'Fecha solped', 'Área', 'Sub-área', 'Clúster', 'Sucursal', 'Nota general', 'Ítem', 'Nota posición',
    'Estado', 'Solped', 'Proveedor', 'Cantidad', 'P.U.', 'Total', 'OC ERP', 'Fecha OC',
  ];
  const filas = registros.map((r) => [
    r.fechaSolped, r.area, r.subarea, r.cluster, r.sucursal, r.notaGeneral, r.item, r.notaPosicion,
    r.estado, r.solped, r.proveedor, r.cantidad, r.precioUnitario, r.total, r.ocErp, r.fechaOc,
  ]);
  descargarCsv(`Detalle_presupuesto_SIG_${new Date().toISOString().slice(0, 10)}.csv`, cabecera, filas);
}
