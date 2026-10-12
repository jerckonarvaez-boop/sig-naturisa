// Listas compartidas que salen del presupuesto (/api/presupuesto/catalogo)
import { apiGet } from './client';

/** Ítem comprado, con el precio unitario de su última compra */
export interface ItemCatalogo {
  nombre: string;
  precioUnitario: number;
  /** AAAA-MM-DD */
  ultimaCompra: string;
}

export interface CatalogoPresupuesto {
  items: ItemCatalogo[];
  /** Sucursales / centros de costo definidos en el presupuesto */
  centrosCosto: string[];
}

export const getCatalogo = () => apiGet<CatalogoPresupuesto>('/presupuesto/catalogo');
