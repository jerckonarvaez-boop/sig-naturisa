// Estructuras del módulo Presupuesto.
// Deben coincidir con server/src/modules/presupuesto/presupuesto.types.ts

export interface Gasto {
  fechaSolped: string;
  area: string;
  subarea: string;
  cluster: string;
  sucursal: string;
  notaGeneral: string;
  item: string;
  notaPosicion: string;
  estado: string;
  solped: string;
  proveedor: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  ocErp: string;
  fechaOc: string;
}

export interface PresupuestoArea {
  area: string;
  monto: number;
}

export interface PresupuestoSubarea {
  area: string;
  subarea: string;
  monto: number;
}

export interface Importacion {
  archivo: string;
  registros: number;
  importadoEn: string;
}

export interface ImportarPresupuestoBody {
  archivo: string;
  gastos: Gasto[];
  presupuestoArea: PresupuestoArea[];
  presupuestoSubarea: PresupuestoSubarea[];
}

export interface PresupuestoData {
  importacion: Importacion | null;
  gastos: Gasto[];
  presupuestoArea: PresupuestoArea[];
  presupuestoSubarea: PresupuestoSubarea[];
}

/** Gasto con campos derivados para filtrar y agrupar */
export interface Registro extends Gasto {
  anio: number | null;
  /** 0 = enero ... 11 = diciembre */
  mes: number | null;
  sucursalNombre: string;
  itemNombre: string;
}

export interface Filtros {
  area: string;
  anio: number | null;
  sucursal: string | null;
  item: string | null;
  subarea: string | null;
  mes: number | null;
  busqueda: string;
}

/** Filtros que se activan haciendo clic en los gráficos */
export type FiltroCruzado = 'sucursal' | 'item' | 'subarea' | 'mes';
