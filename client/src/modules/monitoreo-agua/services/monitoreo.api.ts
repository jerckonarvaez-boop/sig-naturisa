// Monitoreo de agua: /api/monitoreo-agua
import { apiDelete, apiGet, apiPost, apiPut, urlApi } from '@/services/api/client';
import type { PuntoMonitoreo } from '../meta';
import type { DefinicionMonitoreo, Logo, Resultado, ResultadoDatos, Sitio, SitioDatos } from '../types';

export const obtenerDefinicion = () => apiGet<DefinicionMonitoreo>('/monitoreo-agua/definicion');

export const listarSitios = () => apiGet<Sitio[]>('/monitoreo-agua/sitios');
export const crearSitio = (d: SitioDatos) => apiPost<Sitio>('/monitoreo-agua/sitios', d);
export const actualizarSitio = (id: number, d: SitioDatos) => apiPut<Sitio>(`/monitoreo-agua/sitios/${id}`, d);
export const eliminarSitio = (id: number) => apiDelete(`/monitoreo-agua/sitios/${id}`);

export const listarLogos = () => apiGet<Logo[]>('/monitoreo-agua/logos');
export const urlLogo = (id: number) => urlApi(`/monitoreo-agua/logos/${id}`);
export const eliminarLogo = (id: number) => apiDelete(`/monitoreo-agua/logos/${id}`);

/** Lee un archivo como data URL (base64) */
const leerComoDataUrl = (archivo: File) =>
  new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'));
    lector.readAsDataURL(archivo);
  });

export const subirLogo = async (archivo: File) =>
  apiPost<Logo>('/monitoreo-agua/logos', { nombre: archivo.name, datos: await leerComoDataUrl(archivo) });

export const listarResultados = (punto?: PuntoMonitoreo) =>
  apiGet<Resultado[]>(`/monitoreo-agua/resultados${punto ? `?punto=${punto}` : ''}`);
export const obtenerResultado = (id: number) => apiGet<Resultado>(`/monitoreo-agua/resultados/${id}`);
export const crearResultado = (d: ResultadoDatos) => apiPost<Resultado>('/monitoreo-agua/resultados', d);
export const actualizarResultado = (id: number, d: ResultadoDatos) => apiPut<Resultado>(`/monitoreo-agua/resultados/${id}`, d);
export const eliminarResultado = (id: number) => apiDelete(`/monitoreo-agua/resultados/${id}`);

/** Dirección para abrir el PDF original del laboratorio */
export const urlPdf = (id: number) => urlApi(`/monitoreo-agua/resultados/${id}/pdf`);

/** Sube (o reemplaza) el PDF del laboratorio */
export async function subirPdf(id: number, archivo: File): Promise<Resultado> {
  return apiPut<Resultado>(`/monitoreo-agua/resultados/${id}/pdf`, { nombre: archivo.name, datos: await leerComoDataUrl(archivo) });
}

export const quitarPdf = (id: number) => apiDelete(`/monitoreo-agua/resultados/${id}/pdf`);
