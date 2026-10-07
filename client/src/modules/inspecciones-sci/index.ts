import type { AppModule } from '../types';
import { meta } from './meta';
import { InspeccionesSciRoutes } from './InspeccionesSciRoutes';

export const inspeccionesSciModule: AppModule = { ...meta, Page: InspeccionesSciRoutes };
