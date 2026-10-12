import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api/client';
import type { Reparacion, ReparacionDatos } from '../types';

const BASE = '/oxigenometros/reparaciones';

export const listarReparaciones = () => apiGet<Reparacion[]>(BASE);
export const crearReparacion = (datos: ReparacionDatos) => apiPost<Reparacion>(BASE, datos);
export const actualizarReparacion = (id: number, datos: ReparacionDatos) => apiPut<Reparacion>(`${BASE}/${id}`, datos);
export const eliminarReparacion = (id: number) => apiDelete(`${BASE}/${id}`);
