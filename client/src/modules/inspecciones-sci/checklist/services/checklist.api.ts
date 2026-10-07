import { apiDelete, apiGet, apiPost, apiPut, urlApi } from '@/services/api/client';
import type { Foto, ItemChecklist, Revision, RevisionDatos } from '../types';

const BASE = '/checklist-bp';

export const obtenerPlantilla = () => apiGet<ItemChecklist[]>(`${BASE}/plantilla`);
export const listarRevisiones = () => apiGet<Revision[]>(`${BASE}/revisiones`);
export const obtenerRevision = (id: number) => apiGet<Revision>(`${BASE}/revisiones/${id}`);
export const crearRevision = (datos: RevisionDatos) => apiPost<Revision>(`${BASE}/revisiones`, datos);
export const actualizarRevision = (id: number, datos: RevisionDatos) => apiPut<Revision>(`${BASE}/revisiones/${id}`, datos);
export const eliminarRevision = (id: number) => apiDelete(`${BASE}/revisiones/${id}`);

/** Dirección para mostrar una foto: la guardada en el servidor o la recién tomada */
export const urlFoto = (foto: Foto) => ('datos' in foto ? foto.datos : urlApi(`${BASE}/fotos/${foto.id}`));
