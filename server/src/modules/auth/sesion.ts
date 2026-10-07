/**
 * Sesión propia del SIG: cookie HttpOnly firmada con SESSION_SECRET (válida 7 días).
 * La plataforma NO guarda contraseñas; la cookie solo contiene usuario, nombre y vencimiento.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import type { Usuario } from './auth.types.js';

const COOKIE = 'sig_sesion';
const DURACION_MS = 7 * 24 * 60 * 60 * 1000;
const SECRETO = env.sessionSecret || secretoLocal();

/** Sin SESSION_SECRET, usa (o crea) una clave guardada junto a la base de datos */
function secretoLocal(): string {
  const archivo = join(dirname(resolve(env.dbPath)), '.secreto-sesion');
  if (existsSync(archivo)) return readFileSync(archivo, 'utf8').trim();
  const secreto = randomBytes(32).toString('hex');
  mkdirSync(dirname(archivo), { recursive: true });
  writeFileSync(archivo, secreto, { mode: 0o600 });
  return secreto;
}

/** false solo si AUTH_DISABLED=true (desarrollo) */
export const authActiva = () => !env.authDisabled;

const firmar = (valor: string) => createHmac('sha256', SECRETO).update(valor).digest('base64url');

function iguales(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function crearToken(usuario: Usuario): string {
  const datos = Buffer.from(JSON.stringify({ ...usuario, vence: Date.now() + DURACION_MS })).toString('base64url');
  return `${datos}.${firmar(datos)}`;
}

function leerCookie(req: Request): string | null {
  for (const parte of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** Usuario de la cookie de sesión, si la firma es válida y no ha vencido */
export function usuarioDeSesion(req: Request): Usuario | null {
  const [datos, firma] = (leerCookie(req) ?? '').split('.');
  if (!datos || !firma || !iguales(firma, firmar(datos))) return null;
  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8'));
    return s.vence > Date.now() ? { username: s.username, nombre: s.nombre } : null;
  } catch {
    return null;
  }
}

export function guardarSesion(req: Request, res: Response, usuario: Usuario) {
  res.cookie(COOKIE, crearToken(usuario), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: DURACION_MS,
    path: '/',
  });
}

export function borrarSesion(res: Response) {
  res.clearCookie(COOKIE, { path: '/' });
}
