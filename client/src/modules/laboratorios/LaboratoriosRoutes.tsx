import { Navigate, Route, Routes } from 'react-router-dom';
import { OxigenometrosPage } from './oxigenometros/pages/OxigenometrosPage';
import { LaboratoriosInicio } from './pages/LaboratoriosInicio';

// Rutas internas del módulo Laboratorios de análisis (relativas a /laboratorios)
export function LaboratoriosRoutes() {
  return (
    <Routes>
      <Route index element={<LaboratoriosInicio />} />
      <Route path="oxigenometros" element={<OxigenometrosPage />} />
      <Route path="*" element={<Navigate to="/laboratorios" replace />} />
    </Routes>
  );
}
