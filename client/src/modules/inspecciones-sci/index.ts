import type { AppModule } from '../types';
import { meta } from './meta';
import { InspeccionesSciPage } from './InspeccionesSciRoutes';

export const inspeccionesSciModule: AppModule = { ...meta, Page: InspeccionesSciPage };
