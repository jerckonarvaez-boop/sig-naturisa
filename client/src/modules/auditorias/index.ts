import type { AppModule } from '../types';
import { meta } from './meta';
import { AuditoriasPage } from './AuditoriasRoutes';

export const auditoriasModule: AppModule = { ...meta, Page: AuditoriasPage };
