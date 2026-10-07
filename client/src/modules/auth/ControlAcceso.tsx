import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoginPage } from './LoginPage';

/**
 * Único punto que decide si se muestra la aplicación: sin sesión (y con el inicio de sesión
 * activo) muestra la pantalla de ingreso. Cuando existan roles y permisos, se comprueban aquí
 * (y en server/src/middleware/requiereSesion.ts).
 */
export function ControlAcceso({ children }: { children: ReactNode }) {
  const { cargando, authActiva, usuario, error, iniciarSesion } = useAuth();

  if (cargando) {
    return <div className="flex h-screen items-center justify-center bg-brand-950 text-sm text-white/70">Cargando…</div>;
  }

  if (authActiva && !usuario) {
    return <LoginPage onIngresar={iniciarSesion} errorInicial={error} />;
  }

  return <>{children}</>;
}
