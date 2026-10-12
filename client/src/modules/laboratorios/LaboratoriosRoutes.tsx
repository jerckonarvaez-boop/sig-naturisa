import { Navigate, Route, Routes } from 'react-router-dom';
import { InformePage } from './analisis/pages/InformePage';
import { InformesPage } from './analisis/pages/InformesPage';
import type { SeccionId } from './analisis/types';
import { OxigenometrosPage } from './oxigenometros/pages/OxigenometrosPage';
import { LaboratoriosInicio } from './pages/LaboratoriosInicio';

/** Ruta (relativa a /laboratorios) de cada sección de informes */
const SECCIONES: { ruta: string; id: SeccionId }[] = [
  { ruta: 'agua', id: 'agua' },
  { ruta: 'suelo', id: 'suelo' },
  { ruta: 'patologias', id: 'patologia' },
];

// Rutas internas del módulo Laboratorios de análisis (relativas a /laboratorios)
export function LaboratoriosRoutes() {
  return (
    <Routes>
      <Route index element={<LaboratoriosInicio />} />
      <Route path="oxigenometros" element={<OxigenometrosPage />} />
      {SECCIONES.flatMap(({ ruta, id }) => [
        <Route key={ruta} path={ruta} element={<InformesPage seccionId={id} />} />,
        <Route key={`${ruta}-nuevo`} path={`${ruta}/nuevo`} element={<InformePage key="nuevo" seccionId={id} />} />,
        <Route key={`${ruta}-id`} path={`${ruta}/:id`} element={<InformePage seccionId={id} />} />,
      ])}
      <Route path="*" element={<Navigate to="/laboratorios" replace />} />
    </Routes>
  );
}
