import { Navigate, Route, Routes } from 'react-router-dom';
import { FichasPage } from './pages/FichasPage';
import { InformeMonitoreoPage } from './pages/InformeMonitoreoPage';
import { MonitoreoAguaInicio } from './pages/MonitoreoAguaInicio';
import { ResultadoPage } from './pages/ResultadoPage';
import { SubseccionPuntos } from './pages/SubseccionPuntos';
import { PUNTOS_MONITOREO, REPORTES_AGUA, RESULTADOS_AGUA } from './meta';

const PRIMER_PUNTO = PUNTOS_MONITOREO[0].id;

// Rutas internas del módulo Monitoreo de agua (relativas a /monitoreo-agua).
// Cada subsección abre en Afluente y cambia a Efluente con las pestañas.
export function MonitoreoAguaRoutes() {
  return (
    <Routes>
      <Route index element={<MonitoreoAguaInicio />} />
      {[RESULTADOS_AGUA, REPORTES_AGUA].map((sub) => [
        <Route key={sub.id} path={sub.id} element={<Navigate to={`${sub.path}/${PRIMER_PUNTO}`} replace />} />,
        <Route key={`${sub.id}-punto`} path={`${sub.id}/:punto`} element={<SubseccionPuntos subseccion={sub} />} />,
      ])}
      <Route path="resultados/:punto/nuevo" element={<ResultadoPage />} />
      <Route path="resultados/:punto/:id" element={<ResultadoPage />} />
      <Route path="reportes/efluente/:resultadoId/:sitioId" element={<InformeMonitoreoPage />} />
      <Route path="fichas" element={<FichasPage />} />
      <Route path="*" element={<Navigate to="/monitoreo-agua" replace />} />
    </Routes>
  );
}
