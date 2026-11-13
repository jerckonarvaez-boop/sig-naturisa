import type { RequestHandler } from 'express';
import { validarCredenciales } from './auth.service.js';
import { bloqueado, registrarFallo, reiniciarIntentos } from './limiteIntentos.js';
import { authActiva, borrarSesion, guardarSesion, limitesSesion, renovarSesion } from './sesion.js';

// GET /api/auth/estado -> { activa, usuario, inactividadMin, maximaHoras }. Consultarlo cuenta como uso: el cliente
// lo llama mientras la persona trabaja en una pantalla sin guardar, para que la sesión no se cierre
export const estado: RequestHandler = (req, res) => {
  res.json({ activa: authActiva(), usuario: authActiva() ? renovarSesion(req, res) : null, ...limitesSesion });
};

// POST /api/auth/login { username, password }
export const login: RequestHandler = async (req, res) => {
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

  reiniciarIntentos(ip);
  console.log(`[auth] Ingreso: ${resultado.usuario.username}`);
  guardarSesion(req, res, resultado.usuario);
  res.json({ usuario: resultado.usuario });
};

// POST /api/auth/logout
export const logout: RequestHandler = (_req, res) => {
  borrarSesion(res);
  res.json({ ok: true });
};
