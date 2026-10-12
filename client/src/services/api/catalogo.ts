// Listas compartidas que salen del presupuesto (/api/presupuesto/catalogo)
import { apiGet } from './client';

export interface CatalogoPresupuesto {
  /** Sucursales / centros de costo definidos en el presupuesto */
  centrosCosto: string[];
}

export const getCatalogo = () => apiGet<CatalogoPresupuesto>('/presupuesto/catalogo');
