// Estado del sistema (/api/health)
import { apiGet } from './client';

export interface HealthResponse {
  api: 'ok';
  database: 'ok' | 'error';
  timestamp: string;
}

export const getHealth = () => apiGet<HealthResponse>('/health');

/** Direcciones de red del servidor, para abrir la web desde el móvil */
export const obtenerDireccionesRed = () => apiGet<{ urls: string[] }>('/health/red');
