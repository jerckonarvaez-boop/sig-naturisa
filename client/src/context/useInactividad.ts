import { useEffect, useRef, useState } from 'react';

/** Último uso de la plataforma, compartido entre pestañas (trabajar en una mantiene abiertas las demás) */
const CLAVE = 'sig-ultima-actividad';
const EVENTOS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;
/** El aviso aparece cuando faltan estos milisegundos para cerrar la sesión */
export const AVISO_MS = 2 * 60_000;
/** Mientras se usa la plataforma, se avisa al servidor como mucho cada 4 minutos (aunque no se guarde nada) */
const PING_MS = 4 * 60_000;

const leer = () => {
  try {
    return Number(localStorage.getItem(CLAVE)) || 0;
  } catch {
    return 0;
  }
};
const escribir = (t: number) => {
  try {
    localStorage.setItem(CLAVE, String(t));
  } catch {
    /* sin almacenamiento: cuenta solo esta pestaña */
  }
};

/**
 * Cierra la sesión tras `minutos` sin usar la plataforma (ratón, teclado, toques o desplazamiento) en ninguna
 * pestaña. Devuelve cuánto falta (ms) cuando quedan menos de 2 minutos, para mostrar el aviso; si no, null.
 * Mientras se usa, `mantener` avisa al servidor para que su sesión tampoco venza (p. ej. llenando un informe largo).
 */
export function useInactividad(activo: boolean, minutos: number, onVencer: () => void, mantener: () => Promise<unknown>) {
  const [restante, setRestante] = useState<number | null>(null);
  const callbacks = useRef({ onVencer, mantener });
  callbacks.current = { onVencer, mantener };

  useEffect(() => {
    if (!activo) {
      setRestante(null);
      return;
    }
    const limite = minutos * 60_000;
    let local = Date.now();
    let ultimoPing = local;
    escribir(local);

    const marcar = () => {
      const ahora = Date.now();
      if (ahora - local < 5_000) return;
      local = ahora;
      escribir(ahora);
    };
    for (const e of EVENTOS) window.addEventListener(e, marcar, { passive: true, capture: true });

    const revisar = () => {
      const ultima = Math.max(local, leer());
      const ahora = Date.now();
      const quedan = limite - (ahora - ultima);
      if (quedan <= 0) {
        callbacks.current.onVencer();
        return;
      }
      setRestante(quedan <= AVISO_MS ? quedan : null);
      if (ultima > ultimoPing && ahora - ultimoPing >= PING_MS) {
        ultimoPing = ahora;
        callbacks.current.mantener().catch(() => undefined);
      }
    };
    const id = window.setInterval(revisar, 1_000);
    return () => {
      window.clearInterval(id);
      for (const e of EVENTOS) window.removeEventListener(e, marcar, { capture: true });
    };
  }, [activo, minutos]);

  /** "Seguir conectado": cuenta como uso y avisa al servidor al momento */
  const seguir = () => {
    escribir(Date.now());
    setRestante(null);
    callbacks.current.mantener().catch(() => undefined);
  };

  return { restante, seguir };
}
