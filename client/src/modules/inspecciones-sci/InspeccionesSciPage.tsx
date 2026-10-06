import { Navigate, Route, Routes } from 'react-router-dom';
import { CalendarioInspeccionesPage } from './CalendarioInspeccionesPage';
import { ChecklistFormPage } from './checklist/ChecklistFormPage';
import { ChecklistListaPage } from './checklist/ChecklistListaPage';

// Rutas internas del módulo Inspecciones SCI (relativas a /inspecciones-sci)
export function InspeccionesSciPage() {
  return (
    <Routes>
      <Route index element={<CalendarioInspeccionesPage />} />
      <Route path="checklist" element={<ChecklistListaPage />} />
      <Route path="checklist/nueva" element={<ChecklistFormPage />} />
      <Route path="checklist/:id" element={<ChecklistFormPage />} />
      <Route path="*" element={<Navigate to="/inspecciones-sci" replace />} />
    </Routes>
  );
}
