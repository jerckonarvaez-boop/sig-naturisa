// Preferencias del usuario guardadas en este navegador (localStorage).
// Si el almacenamiento no está disponible (modo privado, bloqueado), se usan los valores por defecto.

export type Tema = 'light' | 'dark';

const CLAVE_TEMA = 'sig-theme';

export function leerTema(): Tema {
  try {
    return localStorage.getItem(CLAVE_TEMA) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function guardarTema(tema: Tema) {
  try {
    localStorage.setItem(CLAVE_TEMA, tema);
  } catch {
    // Sin almacenamiento disponible: el tema solo dura la sesión
  }
}
