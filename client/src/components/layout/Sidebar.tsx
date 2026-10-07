import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, type LucideIcon } from 'lucide-react';
import { MODULES } from '@/config/modules';
import type { AppModule } from '@/modules/types';

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ open, onNavigate }: SidebarProps) {
  return (
    <>
      {/* Fondo oscuro detrás del menú en móvil */}
      {open && <div className="fixed inset-0 top-16 z-20 bg-black/40 md:hidden" onClick={onNavigate} />}

      <aside
        className={`fixed inset-y-0 top-16 left-0 z-30 w-64 shrink-0 overflow-y-auto bg-brand-900 px-2 py-3 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1">
          <SidebarLink to="/" label="Dashboard" icon={LayoutDashboard} onNavigate={onNavigate} end />
          {MODULES.map((module) => {
            if (module.status !== 'activo') return <DisabledItem key={module.id} module={module} />;
            if (module.children?.length) return <SidebarGroup key={module.id} module={module} onNavigate={onNavigate} />;
            return (
              <SidebarLink
                key={module.id}
                to={module.path}
                label={module.label}
                icon={module.icon}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>
      </aside>
    </>
  );
}

const linkClasses = (isActive: boolean) =>
  `flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors ${
    isActive
      ? 'border-sky-300 bg-white/15 font-semibold text-white'
      : 'border-transparent text-white/85 hover:bg-white/10 hover:text-white'
  }`;

interface SidebarLinkProps {
  to: string;
  label: string;
  icon: LucideIcon;
  onNavigate: () => void;
  end?: boolean;
}

function SidebarLink({ to, label, icon: Icon, onNavigate, end }: SidebarLinkProps) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate} className={({ isActive }) => linkClasses(isActive)}>
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  );
}

/** Módulo con subsecciones: se despliega automáticamente al entrar en cualquiera de sus rutas. */
function SidebarGroup({ module, onNavigate }: { module: AppModule; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const isInside = pathname === module.path || pathname.startsWith(`${module.path}/`);
  const [expanded, setExpanded] = useState(isInside);
  // Si una subsección usa la misma ruta que el módulo (ej. "Calendario"), se resalta solo la subsección
  const hijoEnRaiz = module.children!.some((child) => child.path === module.path);

  useEffect(() => {
    if (isInside) setExpanded(true);
  }, [isInside]);

  return (
    <div>
      <div className="relative">
        <NavLink
          to={module.path}
          end
          onClick={onNavigate}
          className={({ isActive }) => `${linkClasses(isActive && !hijoEnRaiz)} pr-9 ${isInside ? 'text-white' : ''}`}
        >
          <module.icon size={17} />
          <span>{module.label}</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label={expanded ? `Contraer ${module.label}` : `Desplegar ${module.label}`}
          aria-expanded={expanded}
        >
          <ChevronDown size={15} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-1 ml-[22px] flex flex-col gap-0.5 border-l border-white/20 pl-3">
          {module.children!.map((child) => (
            <NavLink
              key={child.id}
              to={child.path}
              end={child.path === module.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-[13px] transition-colors ${
                  isActive ? 'bg-white/15 font-semibold text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function DisabledItem({ module }: { module: AppModule }) {
  return (
    <div className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40">
      <module.icon size={17} />
      <span className="flex-1">{module.label}</span>
      <span className="rounded-full border border-white/30 px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
        PRÓXIMAMENTE
      </span>
    </div>
  );
}
