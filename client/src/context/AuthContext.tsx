import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEMO_USER } from '@/config/app';
import { EVENTO_SESION_VENCIDA } from '@/services/api/client';
import * as authService from '@/services/auth/auth.service';
import { AvisoInactividad } from './AvisoInactividad';
import { useInactividad } from './useInactividad';
import type { Usuario } from '@/services/auth/auth.service';

export type { Usuario };

interface AuthContextValue {
  /** true mientras se consulta si hay una sesión abierta */
  cargando: boolean;
  /** Error al consultar el estado (ej. servidor caído) */
  error?: string;
  /** Usuario con sesión iniciada (null si no hay sesión o el inicio de sesión está desactivado) */
  usuario: Usuario | null;
  /** Nombre para mostrar en la interfaz */
  nombreVisible: string;
  /** Texto bajo el nombre (usuario de red o rol de demo) */
  detalle: string;
  /** false solo si el servidor tiene el inicio de sesión desactivado */
  authActiva: boolean;
  /** Por qué se cerró la sesión (para explicarlo en la pantalla de ingreso) */
  motivoCierre: 'inactividad' | 'vencida' | null;
  iniciarSesion: (username: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Estado central de la sesión. Quién puede ver la app lo decide modules/auth/ControlAcceso;
 * las llamadas HTTP están en services/auth/auth.service.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{
    cargando: boolean;
    activa: boolean;
    usuario: Usuario | null;
    error?: string;
    inactividadMin: number;
    motivo: 'inactividad' | 'vencida' | null;
  }>({ cargando: true, activa: true, usuario: null, inactividadMin: 30, motivo: null });

  const consultar = useCallback(async () => {
    try {
      const r = await authService.consultarEstado();
      setEstado((e) => ({ ...e, cargando: false, activa: r.activa, usuario: r.usuario, inactividadMin: r.inactividadMin ?? e.inactividadMin }));
    } catch {
      setEstado((e) => ({ ...e, cargando: false, activa: true, usuario: null, error: 'No se pudo conectar con el servidor.' }));
    }
  }, []);

  useEffect(() => {
    consultar();
    // La API respondió 401: la sesión venció (por inactividad o porque se cumplió la duración máxima)
    const alVencer = () => setEstado((e) => ({ ...e, usuario: null, motivo: e.usuario ? 'vencida' : e.motivo }));
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer);
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer);
  }, [consultar]);

  const iniciarSesion = async (username: string, password: string) => {
    const r = await authService.iniciarSesion(username, password);
    setEstado((e) => ({ ...e, cargando: false, activa: true, usuario: r.usuario, error: undefined, motivo: null }));
  };

  const cerrarSesion = async (motivo: 'inactividad' | null = null) => {
    await authService.cerrarSesion().catch(() => undefined);
    setEstado((e) => ({ ...e, usuario: null, motivo }));
  };

  // Tras un rato sin usar la plataforma se cierra la sesión (con aviso 2 minutos antes)
  const { restante, seguir } = useInactividad(
    estado.activa && Boolean(estado.usuario),
    estado.inactividadMin,
    () => cerrarSesion('inactividad'),
    async () => {
      // Avisa al servidor que se está usando; si su sesión ya venció, se pide ingresar de nuevo
      const r = await authService.consultarEstado();
      if (r.activa && !r.usuario) setEstado((e) => ({ ...e, usuario: null, motivo: 'vencida' }));
    },
  );

  const valor: AuthContextValue = {
    cargando: estado.cargando,
    error: estado.error,
    usuario: estado.usuario,
    nombreVisible: estado.usuario?.nombre ?? DEMO_USER.name,
    detalle: estado.usuario?.username ?? DEMO_USER.role,
    authActiva: estado.activa,
    motivoCierre: estado.motivo,
    iniciarSesion,
    cerrarSesion: () => cerrarSesion(),
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
      {restante != null && estado.usuario && <AvisoInactividad restante={restante} onSeguir={seguir} />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
