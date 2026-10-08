import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/database.js';
import { cargarSemillaPresupuesto } from './modules/presupuesto/presupuesto.semilla.js';

runMigrations();
// Datos iniciales si la base de datos arranca vacía (ver modules/presupuesto/presupuesto.semilla.ts)
cargarSemillaPresupuesto();

createApp().listen(env.port, () => {
  console.log(`[api] SIG API escuchando en http://localhost:${env.port}`);
});
