import type { AppModule } from '../types';
import { meta } from './meta';
import { MonitoreoAguaRoutes } from './MonitoreoAguaRoutes';

export const monitoreoAguaModule: AppModule = { ...meta, Page: MonitoreoAguaRoutes };
