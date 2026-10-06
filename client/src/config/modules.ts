import type { AppModule } from '@/modules/types';
import { auditoriasModule } from '@/modules/auditorias';
import { laboratoriosModule } from '@/modules/laboratorios';
import { inspeccionesSciModule } from '@/modules/inspecciones-sci';
import { gestionDesechosModule } from '@/modules/gestion-desechos';
import { presupuestoModule } from '@/modules/presupuesto';

/**
 * Registro central de módulos.
 * El menú lateral y las rutas se generan a partir de esta lista:
 * para agregar un módulo, crea su carpeta en src/modules y añádelo aquí.
 * Con status 'proximamente' aparece en el menú deshabilitado.
 */
export const MODULES: AppModule[] = [
  auditoriasModule,
  laboratoriosModule,
  inspeccionesSciModule,
  gestionDesechosModule,
  presupuestoModule,
];
