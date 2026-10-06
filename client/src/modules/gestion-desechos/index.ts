import type { AppModule } from '../types';
import { meta } from './meta';
import { GestionDesechosPage } from './GestionDesechosPage';

export const gestionDesechosModule: AppModule = { ...meta, Page: GestionDesechosPage };
