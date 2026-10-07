/**
 * Validación de usuario y contraseña contra el servicio de seguridad del portal de Naturisa (AUTH_URL).
 * Las credenciales solo se reenvían por HTTPS; no se guardan.
 */
import { env } from '../../config/env.js';
import type { ResultadoValidacion } from './auth.types.js';

/** Busca un campo sin importar mayúsculas (el servicio usa "Data" o "data", etc.) */
function campo(obj: unknown, ...nombres: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const claves = Object.keys(obj);
  for (const n of nombres) {
    const k = claves.find((c) => c.toLowerCase() === n.toLowerCase());
    if (k) return (obj as Record<string, unknown>)[k];
  }
  return undefined;
}

const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Nombre para mostrar: el servicio devuelve data.usuario { firstNames, lastNames } */
function nombreVisible(data: unknown, username: string): string {
  const u = campo(data, 'usuario', 'user');
  const nombre = `${texto(campo(u, 'firstNames'))} ${texto(campo(u, 'lastNames'))}`.trim();
  return nombre || texto(campo(u, 'fullName')) || username;
}

export async function validarCredenciales(username: string, password: string): Promise<ResultadoValidacion> {
  let respuesta: Response;
  try {
    respuesta = await fetch(env.authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // Mismo formato que usa el portal de Naturisa al iniciar sesión
      body: JSON.stringify({ userName: username, password, codeApplication: env.authAppCode, includeUserInfo: true }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error('[auth] No se pudo contactar el servicio de autenticación:', (error as Error).message);
    return { ok: false, status: 503, error: 'No se pudo contactar el servicio de autenticación de Naturisa. Intente más tarde.' };
  }

  const cuerpo = await respuesta.json().catch(() => null);
  const data = campo(cuerpo, 'data');

  if (campo(data, 'twoFactorRequired') === true) {
    return { ok: false, status: 403, error: 'Su cuenta requiere verificación en dos pasos, que aún no está disponible en esta plataforma.' };
  }
  if (campo(data, 'forceChangePasswordRequired') === true) {
    return { ok: false, status: 403, error: 'Debe cambiar su contraseña en el portal de Naturisa antes de ingresar.' };
  }
  if (respuesta.ok && campo(data, 'authenticate') === true) {
    return { ok: true, usuario: { username, nombre: nombreVisible(data, username) } };
  }
  if (respuesta.status === 400) {
    const detalles = campo(cuerpo, 'data');
    const mensaje = Array.isArray(detalles) ? detalles.join(' ') : 'Datos de acceso no válidos.';
    return { ok: false, status: 400, error: mensaje };
  }
  if (respuesta.status === 401 || respuesta.ok) {
    return { ok: false, status: 401, error: 'Usuario o contraseña incorrectos.' };
  }
  console.error('[auth] Respuesta inesperada del servicio de autenticación:', respuesta.status);
  return { ok: false, status: 502, error: 'El servicio de autenticación respondió con un error. Intente más tarde.' };
}
