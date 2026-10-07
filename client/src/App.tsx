import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { MODULES } from './config/modules';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        {/* Las rutas de los módulos se generan desde config/modules.ts */}
        {MODULES.filter((m) => m.status === 'activo').map(({ id, path, Page }) => (
          <Route key={id} path={`${path}/*`} element={<Page />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
