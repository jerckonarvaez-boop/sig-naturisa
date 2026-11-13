/**
 * Sesión propia del SIG: cookie HttpOnly firmada con SESSION_SECRET. Se cierra tras SESION_INACTIVIDAD_MIN minutos
 * sin usar la plataforma (30 por defecto) y, aunque se use, a las SESION_MAXIMA_HORAS horas (10) de haber ingresado.
 * Cada uso la renueva (como mucho una vez por minuto). La plataforma NO guarda contraseñas; la cookie solo contiene
 * usuario, nombre, cuándo se ingresó y cuándo se usó por última vez.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import type { Usuario } from './auth.types.js';

const COOKIE = 'sig_sesion';
const INACTIVIDAD_MS = env.sesionInactividadMin * 60_000;
const MAXIMA_MS = env.sesionMaximaHoras * 3_600_000;
/** No se reescribe la cookie en cada petición: basta con renovarla una vez por minuto */
const RENOVAR_CADA_MS = 60_000;

/** Límites de la sesión que el cliente necesita para avisar antes de cerrarla */
export const limitesSesion = { inactividadMin: env.sesionInactividadMin, maximaHoras: env.sesionMaximaHoras };

interface DatosSesion extends Usuario {
  /** Cuándo se ingresó (ms) */
  inicio: number;
  /** Último uso (ms) */
  ultimo: number;
}
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

function crearToken(s: DatosSesion): string {
  const datos = Buffer.from(JSON.stringify({ username: s.username, nombre: s.nombre, inicio: s.inicio, ultimo: s.ultimo })).toString('base64url');
  return `${datos}.${firmar(datos)}`;
}

function leerCookie(req: Request): string | null {
  for (const parte of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

/** Datos de la cookie de sesión, si la firma es válida y no venció (por inactividad o por duración máxima) */
function leerSesion(req: Request): DatosSesion | null {
  const [datos, firma] = (leerCookie(req) ?? '').split('.');
  if (!datos || !firma || !iguales(firma, firmar(datos))) return null;
  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8'));
    // Las cookies del formato anterior (sin inicio ni último uso) ya no valen: se vuelve a ingresar
    if (typeof s.inicio !== 'number' || typeof s.ultimo !== 'number') return null;
    const ahora = Date.now();
    if (ahora - s.ultimo > INACTIVIDAD_MS || ahora - s.inicio > MAXIMA_MS) return null;
    return { username: s.username, nombre: s.nombre, inicio: s.inicio, ultimo: s.ultimo };
  } catch {
    return null;
  }
}

/** Usuario de la cookie de sesión, si es válida */
export function usuarioDeSesion(req: Request): Usuario | null {
  const s = leerSesion(req);
  return s ? { username: s.username, nombre: s.nombre } : null;
}

function escribirCookie(req: Request, res: Response, s: DatosSesion) {
  res.cookie(COOKIE, crearToken(s), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    // La cookie desaparece al cumplirse la duración máxima de la sesión
    maxAge: Math.max(0, MAXIMA_MS - (Date.now() - s.inicio)),
    path: '/',
  });
}

export function guardarSesion(req: Request, res: Response, usuario: Usuario) {
  const ahora = Date.now();
  escribirCookie(req, res, { ...usuario, inicio: ahora, ultimo: ahora });
}

/**
 * Usuario de la sesión, marcando que se acaba de usar la plataforma (la sesión sigue abierta otros 30 minutos).
 * null si no hay sesión o ya venció.
 */
export function renovarSesion(req: Request, res: Response): Usuario | null {
  const s = leerSesion(req);
  if (!s) return null;
  if (Date.now() - s.ultimo > RENOVAR_CADA_MS) escribirCookie(req, res, { ...s, ultimo: Date.now() });
  return { username: s.username, nombre: s.nombre };
}

export function borrarSesion(res: Response) {
  res.clearCookie(COOKIE, { path: '/' });
}
