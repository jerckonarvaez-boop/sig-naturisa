import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api/client';
import type { DefinicionLaboratorio, Informe, InformeDatos, InformeResumen, SeccionId } from '../types';

const BASE = '/laboratorio';

export const obtenerDefinicion = () => apiGet<DefinicionLaboratorio>(`${BASE}/secciones`);
export const listarInformes = (seccion: SeccionId) => apiGet<InformeResumen[]>(`${BASE}/informes?seccion=${seccion}`);
export const obtenerInforme = (id: number) => apiGet<Informe>(`${BASE}/informes/${id}`);
export const crearInforme = (datos: InformeDatos) => apiPost<Informe>(`${BASE}/informes`, datos);
export const actualizarInforme = (id: number, datos: InformeDatos) => apiPut<Informe>(`${BASE}/informes/${id}`, datos);
export const eliminarInforme = (id: number) => apiDelete(`${BASE}/informes/${id}`);
