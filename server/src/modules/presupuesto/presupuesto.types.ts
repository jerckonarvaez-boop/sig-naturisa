// Estructuras que intercambian el backend y el frontend del módulo Presupuesto

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

/** Cuerpo de POST /api/presupuesto/importar */
export interface ImportarPresupuestoBody {
  archivo: string;
  gastos: Gasto[];
  presupuestoArea: PresupuestoArea[];
  presupuestoSubarea: PresupuestoSubarea[];
}

/** Respuesta de GET /api/presupuesto */
export interface PresupuestoData {
  importacion: Importacion | null;
  gastos: Gasto[];
  presupuestoArea: PresupuestoArea[];
  presupuestoSubarea: PresupuestoSubarea[];
}
