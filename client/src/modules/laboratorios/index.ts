import type { AppModule } from '../types';
import { meta } from './meta';
import { LaboratoriosPage } from './pages/LaboratoriosPage';

export const laboratoriosModule: AppModule = { ...meta, Page: LaboratoriosPage };
