// Cliente HTTP base. Todas las llamadas al backend deben pasar por aquí.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/** URL completa de un recurso de la API (para <img src>, descargas, etc.) */
export const urlApi = (path: string) => `${BASE_URL}${path}`;

/** Evento que se emite cuando la API responde 401 (sesión vencida): la app vuelve al inicio de sesión */
export const EVENTO_SESION_VENCIDA = 'sig:sesion-vencida';

async function comprobar(res: Response, metodo: string, path: string) {
  if (res.ok) return;
  if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event(EVENTO_SESION_VENCIDA));
  const detalle = await res.json().catch(() => null);
  throw new Error(detalle?.error ?? `Error ${res.status} en ${metodo} ${path}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'same-origin' });
  await comprobar(res, 'GET', path);
  return res.json() as Promise<T>;
}

async function enviar<T>(metodo: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: metodo,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  await comprobar(res, metodo, path);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const apiPost = <T>(path: string, body: unknown) => enviar<T>('POST', path, body);
export const apiPut = <T>(path: string, body: unknown) => enviar<T>('PUT', path, body);
export const apiDelete = (path: string) => enviar<void>('DELETE', path);

export interface HealthResponse {
  api: 'ok';
  database: 'ok' | 'error';
  timestamp: string;
}

export const getHealth = () => apiGet<HealthResponse>('/health');
