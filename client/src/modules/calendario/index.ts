import type { AppModule } from '../types';
import { meta } from './meta';
import { CalendarioPage } from './pages/CalendarioPage';

export const calendarioModule: AppModule = { ...meta, Page: CalendarioPage };
