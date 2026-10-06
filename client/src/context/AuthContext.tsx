import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEMO_USER } from '@/config/app';
import { apiGet, apiPost, EVENTO_SESION_VENCIDA } from '@/services/api';
import { LoginPage } from '@/pages/LoginPage';

export interface Usuario {
  username: string;
  nombre: string;
}

interface AuthContextValue {
  /** Usuario con sesión iniciada (null si el inicio de sesión está desactivado) */
  usuario: Usuario | null;
  /** Nombre para mostrar en la interfaz */
  nombreVisible: string;
  /** Texto bajo el nombre (usuario de red o rol de demo) */
  detalle: string;
  authActiva: boolean;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Controla el acceso: si el inicio de sesión está activo y no hay sesión, muestra la pantalla
 * de ingreso en lugar de la aplicación.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ cargando: boolean; activa: boolean; usuario: Usuario | null; error?: string }>({
    cargando: true,
    activa: true,
    usuario: null,
  });

  const consultar = useCallback(async () => {
    try {
      const r = await apiGet<{ activa: boolean; usuario: Usuario | null }>('/auth/estado');
      setEstado({ cargando: false, activa: r.activa, usuario: r.usuario });
    } catch {
      setEstado({ cargando: false, activa: true, usuario: null, error: 'No se pudo conectar con el servidor.' });
    }
  }, []);

  useEffect(() => {
    consultar();
    const alVencer = () => setEstado((e) => ({ ...e, usuario: null }));
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, [consultar]);

  const iniciarSesion = async (username: string, password: string) => {
    const r = await apiPost<{ usuario: Usuario }>('/auth/login', { username, password });
    setEstado({ cargando: false, activa: true, usuario: r.usuario });
  };

  const cerrarSesion = async () => {
    await apiPost('/auth/logout', {}).catch(() => undefined);
    setEstado((e) => ({ ...e, usuario: null }));
  };

  if (estado.cargando) {
    return <div className="flex h-screen items-center justify-center bg-brand-950 text-sm text-white/70">Cargando…</div>;
  }

  if (estado.activa && !estado.usuario) {
    return <LoginPage onIngresar={iniciarSesion} errorInicial={estado.error} />;
  }

  const valor: AuthContextValue = {
    usuario: estado.usuario,
    nombreVisible: estado.usuario?.nombre ?? DEMO_USER.name,
    detalle: estado.usuario?.username ?? DEMO_USER.role,
    authActiva: estado.activa,
    cerrarSesion,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
