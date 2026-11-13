import type { RequestHandler } from 'express';
import { authActiva, renovarSesion } from '../modules/auth/sesion.js';

/**
 * Único punto de control de acceso a la API: exige una sesión válida (salvo AUTH_DISABLED=true) y la renueva
 * (cada petición cuenta como uso; tras 30 minutos sin usar la plataforma, la sesión se cierra).
 * Deja el usuario en res.locals.usuario. Cuando existan roles y permisos, se comprueban aquí.
 */
export const requiereSesion: RequestHandler = (req, res, next) => {
  if (!authActiva()) {
    next();
    return;
  }
  const usuario = renovarSesion(req, res);
  if (!usuario) {
    res.status(401).json({ error: 'Sesión no iniciada o vencida.' });
    return;
  }
  res.locals.usuario = usuario;
  next();
};
