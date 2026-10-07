import { APP_CONFIG } from '@/config/app';

// Si APP_CONFIG.logoUrl tiene un valor, se muestra la imagen; si no, el nombre en texto.
export function Logo() {
  if (APP_CONFIG.logoUrl) {
    return <img src={APP_CONFIG.logoUrl} alt={APP_CONFIG.company} className="h-8 w-auto" />;
  }
  return <span className="text-xl font-extrabold tracking-tight">{APP_CONFIG.company}</span>;
}
