import type { AppModule } from '../types';
import { meta } from './meta';
import { AuditoriasRoutes } from './AuditoriasRoutes';

export const auditoriasModule: AppModule = { ...meta, Page: AuditoriasRoutes };
