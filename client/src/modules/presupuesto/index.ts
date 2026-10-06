import type { AppModule } from '../types';
import { meta } from './meta';
import { PresupuestoPage } from './PresupuestoPage';

export const presupuestoModule: AppModule = { ...meta, Page: PresupuestoPage };
