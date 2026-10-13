import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api/client';
import type { DefinicionLaboratorio, Informe, InformeDatos, InformeResumen, SeccionId } from '../types';

const BASE = '/laboratorio';

export const obtenerDefinicion = () => apiGet<DefinicionLaboratorio>(`${BASE}/secciones`);
export const listarInformes = (seccion: SeccionId) => apiGet<InformeResumen[]>(`${BASE}/informes?seccion=${seccion}`);
export const obtenerInforme = (id: number) => apiGet<Informe>(`${BASE}/informes/${id}`);
export const crearInforme = (datos: InformeDatos) => apiPost<Informe>(`${BASE}/informes`, datos);
export const actualizarInforme = (id: number, datos: InformeDatos) => apiPut<Informe>(`${BASE}/informes/${id}`, datos);
export const eliminarInforme = (id: number) => apiDelete(`${BASE}/informes/${id}`);

// ---------- correo ----------
export interface PlantillaCorreo {
  asunto: string;
  mensaje: string;
}

/** Texto predeterminado del correo y últimos destinatarios usados para ese centro de costo / cliente */
export const obtenerCorreo = (sucursal: string) =>
  apiGet<{ plantilla: PlantillaCorreo; para: string; cc: string }>(`${BASE}/correo?sucursal=${encodeURIComponent(sucursal)}`);
export const guardarPlantillaCorreo = (p: PlantillaCorreo) => apiPut<PlantillaCorreo>(`${BASE}/correo/plantilla`, p);
/** Guarda (y valida) los destinatarios; devuelve las listas normalizadas "a@x.com; b@y.com" */
export const guardarDestinatarios = (sucursal: string, para: string, cc: string) =>
  apiPut<{ para: string; cc: string }>(`${BASE}/correo/destinatarios`, { sucursal, para, cc });
