import { abrirExcel, aFechaISO, aNumero, aTexto } from '@/utils/excel';
import type { ImportarPresupuestoBody } from './types';

/** Tablas que debe tener el Excel "Control de presupuesto SIG" */
const TABLA_GASTOS = 'Consulta2';
const TABLA_PRES_AREA = 'PresupuestoTipo';
const TABLA_PRES_SUBAREA = 'PresuestoArea';

/** Lee el Excel del presupuesto y lo convierte al formato que espera la API. */
export async function leerExcelPresupuesto(archivo: File): Promise<ImportarPresupuestoBody> {
  const libro = await abrirExcel(await archivo.arrayBuffer());

  const faltan = [TABLA_GASTOS, TABLA_PRES_AREA, TABLA_PRES_SUBAREA].filter((t) => !libro.tablas.includes(t));
  if (faltan.length) {
    throw new Error(
      `El Excel "${archivo.name}" no tiene las tablas: ${faltan.join(', ')}. ¿Es el Control de presupuesto SIG?`,
    );
  }

  const [filasGastos, filasArea, filasSubarea] = await Promise.all([
    libro.tabla(TABLA_GASTOS),
    libro.tabla(TABLA_PRES_AREA),
    libro.tabla(TABLA_PRES_SUBAREA),
  ]);

  const gastos = (filasGastos ?? [])
    .map((r) => ({
      fechaSolped: aFechaISO(r.fechasolped),
      area: aTexto(r.area),
      subarea: aTexto(r.subarea),
      cluster: aTexto(r.cluster),
      sucursal: aTexto(r.sucursal),
      notaGeneral: aTexto(r.notageneral),
      item: aTexto(r.nombredeitem),
      notaPosicion: aTexto(r.notaposicion),
      estado: aTexto(r.estado),
      solped: aTexto(r.solped),
      proveedor: aTexto(r.proveedor),
      cantidad: aNumero(r.cantaprobada),
      precioUnitario: aNumero(r.pubase),
      total: aNumero(r.total),
      ocErp: aTexto(r.ocerp),
      fechaOc: aFechaISO(r.fechaoc),
    }))
    .filter((g) => g.area || g.total);

  if (!gastos.length) {
    throw new Error(`La tabla ${TABLA_GASTOS} está vacía. En Excel use Datos ▸ Actualizar todo, guarde y vuelva a intentar.`);
  }

  return {
    archivo: archivo.name,
    gastos,
    presupuestoArea: (filasArea ?? [])
      .filter((r) => aTexto(r.area))
      .map((r) => ({ area: aTexto(r.area), monto: aNumero(r.presupuesto) })),
    presupuestoSubarea: (filasSubarea ?? [])
      .filter((r) => aTexto(r.subarea))
      .map((r) => ({ area: aTexto(r.area), subarea: aTexto(r.subarea), monto: aNumero(r.presupuesto) })),
  };
}
