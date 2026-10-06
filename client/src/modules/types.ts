import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export type ModuleStatus = 'activo' | 'proximamente';

/** Subsección de un módulo (aparece como submenú en la barra lateral). */
export interface SubSection {
  id: string;
  label: string;
  description: string;
  /** Ruta completa, ej. '/auditorias/asc' */
  path: string;
}

/** Datos descriptivos de un módulo (nombre, ruta, ícono...). */
export interface ModuleMeta {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  status: ModuleStatus;
  /** Opcional: subsecciones que se muestran como submenú desplegable. */
  children?: SubSection[];
}

/** Módulo completo: sus datos + la página principal que se muestra en su ruta. */
export interface AppModule extends ModuleMeta {
  Page: ComponentType;
}
