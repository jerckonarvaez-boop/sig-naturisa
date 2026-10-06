import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Escucha también en la red local para poder abrir la app desde un móvil (http://IP-del-PC:5173)
    host: true,
    // Las llamadas a /api se redirigen al backend durante el desarrollo
    proxy: { '/api': 'http://localhost:4000' },
  },
});
