import type { AppModule } from '../types';
import { meta } from './meta';
import { ConfiguracionPage } from './pages/ConfiguracionPage';

export const configuracionModule: AppModule = { ...meta, Page: ConfiguracionPage };
