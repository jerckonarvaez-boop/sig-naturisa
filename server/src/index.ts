import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/database.js';

runMigrations();

createApp().listen(env.port, () => {
  console.log(`[api] SIG API escuchando en http://localhost:${env.port}`);
});
