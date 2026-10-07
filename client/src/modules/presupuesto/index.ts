import type { AppModule } from '../types';
import { meta } from './meta';
import { PresupuestoPage } from './pages/PresupuestoPage';

export const presupuestoModule: AppModule = { ...meta, Page: PresupuestoPage };
