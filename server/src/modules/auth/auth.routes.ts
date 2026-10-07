/**
 * Inicio de sesión con las credenciales corporativas de Naturisa (rutas públicas /api/auth).
 * - auth.service.ts   → valida contra el servicio del portal (AUTH_URL)
 * - sesion.ts         → cookie de sesión firmada
 * - limiteIntentos.ts → bloqueo temporal tras varios fallos
 * - middleware/requiereSesion.ts protege el resto de la API.
 */
import { Router } from 'express';
import { estado, login, logout } from './auth.controller.js';

export const authRouter = Router();

authRouter.get('/estado', estado);
authRouter.post('/login', login);
authRouter.post('/logout', logout);
