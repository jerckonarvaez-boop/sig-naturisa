// Cliente HTTP base. Todas las llamadas al backend deben pasar por aquí.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`Error ${res.status} en GET ${path}`);
  return res.json() as Promise<T>;
}

async function enviar<T>(metodo: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: metodo,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detalle = await res.json().catch(() => null);
    throw new Error(detalle?.error ?? `Error ${res.status} en ${metodo} ${path}`);
  }
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
