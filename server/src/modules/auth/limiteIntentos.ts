// Límite de intentos fallidos de inicio de sesión por IP, para frenar ataques de fuerza bruta.

const MAX_FALLOS = 10;
const VENTANA_MS = 15 * 60 * 1000;
const intentos = new Map<string, { fallos: number; hasta: number }>();

export function bloqueado(ip: string) {
  const r = intentos.get(ip);
  return Boolean(r && r.hasta > Date.now() && r.fallos >= MAX_FALLOS);
}

export function registrarFallo(ip: string) {
  const r = intentos.get(ip);
  if (!r || r.hasta < Date.now()) intentos.set(ip, { fallos: 1, hasta: Date.now() + VENTANA_MS });
  else r.fallos++;
}

export function reiniciarIntentos(ip: string) {
  intentos.delete(ip);
}
