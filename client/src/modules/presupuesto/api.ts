import { apiGet, apiPost } from '@/services/api';
import type { Importacion, ImportarPresupuestoBody, PresupuestoData } from './types';

export const obtenerPresupuesto = () => apiGet<PresupuestoData>('/presupuesto');

export const importarPresupuesto = (body: ImportarPresupuestoBody) =>
  apiPost<Importacion>('/presupuesto/importar', body);
