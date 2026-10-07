import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { AbrirEnMovil } from '@/components/layout/AbrirEnMovil';
import { Logo } from '@/components/layout/Logo';
import { APP_CONFIG } from '@/config/app';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getInitials } from '@/utils/texto';

interface HeaderProps {
  onToggleMenu: () => void;
}

export function Header({ onToggleMenu }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { nombreVisible, detalle, authActiva, cerrarSesion } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-950 px-4 text-white shadow-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMenu}
          className="rounded-md p-1.5 hover:bg-white/10 md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <Logo />
        <div className="hidden h-8 w-px bg-white/25 sm:block" />
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-bold">{APP_CONFIG.name}</p>
          <p className="text-xs text-white/70">{APP_CONFIG.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <AbrirEnMovil />
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-md p-1.5 hover:bg-white/10"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm font-semibold">{nombreVisible}</p>
          <p className="text-xs text-white/70">{detalle}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-950">
          {getInitials(nombreVisible)}
        </div>
        {authActiva && (
          <button
            type="button"
            onClick={cerrarSesion}
            className="rounded-md p-1.5 hover:bg-white/10"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
