// Llamadas de inicio de sesión (/api/auth). El estado de la sesión vive en context/AuthContext.
import { apiGet, apiPost } from '@/services/api/client';

export interface Usuario {
  username: string;
  nombre: string;
}

/** activa = false solo si el servidor tiene el inicio de sesión desactivado (AUTH_DISABLED) */
export const consultarEstado = () => apiGet<{ activa: boolean; usuario: Usuario | null }>('/auth/estado');

export const iniciarSesion = (username: string, password: string) =>
  apiPost<{ usuario: Usuario }>('/auth/login', { username, password });

export const cerrarSesion = () => apiPost('/auth/logout', {});
