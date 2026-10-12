import type { AppModule } from '../types';
import { meta } from './meta';
import { LaboratoriosRoutes } from './LaboratoriosRoutes';

export const laboratoriosModule: AppModule = { ...meta, Page: LaboratoriosRoutes };
