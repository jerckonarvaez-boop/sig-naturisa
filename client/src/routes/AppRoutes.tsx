import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { MODULES } from '@/config/modules';
import { DashboardPage } from '@/modules/dashboard/DashboardPage';
import { NotFoundPage } from './NotFoundPage';

/**
 * Rutas principales. Las de cada módulo se generan desde config/modules.ts;
 * las rutas internas de un módulo están en su archivo *Routes.tsx.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        {MODULES.filter((m) => m.status === 'activo').map(({ id, path, Page }) => (
          <Route key={id} path={`${path}/*`} element={<Page />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
