/**
 * Inicio de sesión con las credenciales corporativas de Naturisa.
 * - Usuario y contraseña se validan contra el servicio de seguridad del portal (AUTH_URL).
 *   La plataforma NO guarda contraseñas: solo las reenvía por HTTPS y crea una sesión propia.
 * - La sesión es una cookie HttpOnly firmada con SESSION_SECRET (válida 7 días).
 * - Límite de intentos fallidos por IP para frenar ataques de fuerza bruta.
 * - AUTH_DISABLED=true desactiva el inicio de sesión (solo para desarrollo).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { Router, type Request, type RequestHandler } from 'express';
import { env } from '../../config/env.js';

export interface Usuario {
  username: string;
  nombre: string;
}

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

export const authActiva = () => !env.authDisabled;

// ---------- sesión firmada ----------
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

function usuarioDeSesion(req: Request): Usuario | null {
  const [datos, firma] = (leerCookie(req) ?? '').split('.');
  if (!datos || !firma || !iguales(firma, firmar(datos))) return null;
  try {
    const s = JSON.parse(Buffer.from(datos, 'base64url').toString('utf8'));
    return s.vence > Date.now() ? { username: s.username, nombre: s.nombre } : null;
  } catch {
    return null;
  }
}

/** Protege la API: exige una sesión válida (salvo que el acceso esté desactivado) */
export const requiereSesion: RequestHandler = (req, res, next) => {
  if (!authActiva() || usuarioDeSesion(req)) {
    next();
    return;
  }
  res.status(401).json({ error: 'Sesión no iniciada o vencida.' });
};

// ---------- límite de intentos ----------
const intentos = new Map<string, { fallos: number; hasta: number }>();
const MAX_FALLOS = 10;
const VENTANA_MS = 15 * 60 * 1000;

function bloqueado(ip: string) {
  const r = intentos.get(ip);
  return Boolean(r && r.hasta > Date.now() && r.fallos >= MAX_FALLOS);
}

function registrarFallo(ip: string) {
  const r = intentos.get(ip);
  if (!r || r.hasta < Date.now()) intentos.set(ip, { fallos: 1, hasta: Date.now() + VENTANA_MS });
  else r.fallos++;
}

// ---------- validación contra el servicio corporativo ----------
type Resultado = { ok: true; usuario: Usuario } | { ok: false; status: number; error: string };

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

async function validarCredenciales(username: string, password: string): Promise<Resultado> {
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
    const texto = Array.isArray(detalles) ? detalles.join(' ') : 'Datos de acceso no válidos.';
    return { ok: false, status: 400, error: texto };
  }
  if (respuesta.status === 401 || respuesta.ok) {
    return { ok: false, status: 401, error: 'Usuario o contraseña incorrectos.' };
  }
  console.error('[auth] Respuesta inesperada del servicio de autenticación:', respuesta.status);
  return { ok: false, status: 502, error: 'El servicio de autenticación respondió con un error. Intente más tarde.' };
}

// ---------- rutas /api/auth ----------
export const authRouter = Router();

// GET /api/auth/estado -> { activa, usuario }
authRouter.get('/estado', (req, res) => {
  res.json({ activa: authActiva(), usuario: authActiva() ? usuarioDeSesion(req) : null });
});

// POST /api/auth/login { username, password }
authRouter.post('/login', async (req, res) => {
  if (!authActiva()) {
    res.json({ usuario: null });
    return;
  }
  const ip = req.ip ?? 'desconocida';
  if (bloqueado(ip)) {
    res.status(429).json({ error: 'Demasiados intentos fallidos. Espere 15 minutos e intente de nuevo.' });
    return;
  }

  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!username || !password) {
    res.status(400).json({ error: 'Ingrese su usuario y contraseña.' });
    return;
  }

  const resultado = await validarCredenciales(username, password);
  if (!resultado.ok) {
    if (resultado.status === 401) registrarFallo(ip);
    res.status(resultado.status).json({ error: resultado.error });
    return;
  }

  intentos.delete(ip);
  console.log(`[auth] Ingreso: ${resultado.usuario.username}`);
  res.cookie(COOKIE, crearToken(resultado.usuario), {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: DURACION_MS,
    path: '/',
  });
  res.json({ usuario: resultado.usuario });
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});
