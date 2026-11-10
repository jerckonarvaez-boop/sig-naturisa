import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api/client';
import type { DefinicionLaboratorio, Informe, InformeDatos, InformeResumen, ParametroQuimico, ParametrosQuimicos, SeccionId } from '../types';

const BASE = '/laboratorio';

export const obtenerDefinicion = () => apiGet<DefinicionLaboratorio>(`${BASE}/secciones`);
// ---------- parámetros químicos del agua (Configuración) ----------
export const obtenerParametrosQuimicos = () => apiGet<ParametrosQuimicos>(`${BASE}/parametros-quimicos`);
export const guardarParametrosQuimicos = (parametros: ParametroQuimico[]) => apiPut<ParametrosQuimicos>(`${BASE}/parametros-quimicos`, { parametros });
/** Vuelve a los de fábrica y devuelve la lista vigente */
export const restaurarParametrosQuimicos = () => apiDelete(`${BASE}/parametros-quimicos`).then(obtenerParametrosQuimicos);

export const listarInformes = (seccion: SeccionId) => apiGet<InformeResumen[]>(`${BASE}/informes?seccion=${seccion}`);
/** Todos los informes con los valores de sus muestras (Dashboard) */
export const listarResultados = () => apiGet<Informe[]>(`${BASE}/resultados`);
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
