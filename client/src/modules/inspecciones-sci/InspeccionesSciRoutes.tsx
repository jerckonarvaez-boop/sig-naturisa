import { Navigate, Route, Routes } from 'react-router-dom';
import { InspeccionesInicio } from './pages/InspeccionesInicio';
import { ChecklistFormPage } from './checklist/pages/ChecklistFormPage';
import { ChecklistListaPage } from './checklist/pages/ChecklistListaPage';

// Rutas internas del módulo Inspecciones SCI (relativas a /inspecciones-sci)
export function InspeccionesSciRoutes() {
  return (
    <Routes>
      <Route index element={<InspeccionesInicio />} />
      <Route path="checklist" element={<ChecklistListaPage />} />
      <Route path="checklist/nueva" element={<ChecklistFormPage />} />
      <Route path="checklist/:id" element={<ChecklistFormPage />} />
      <Route path="*" element={<Navigate to="/inspecciones-sci" replace />} />
    </Routes>
  );
}
