import { Navigate, Route, Routes } from 'react-router-dom';
import { AuditoriasInicio } from './AuditoriasInicio';
import { CertificacionAscPage } from './certificacion-asc/CertificacionAscPage';
import { CertificacionBapPage } from './certificacion-bap/CertificacionBapPage';

// Rutas internas del módulo Auditorías (relativas a /auditorias)
export function AuditoriasPage() {
  return (
    <Routes>
      <Route index element={<AuditoriasInicio />} />
      <Route path="asc/*" element={<CertificacionAscPage />} />
      <Route path="bap/*" element={<CertificacionBapPage />} />
      <Route path="*" element={<Navigate to="/auditorias" replace />} />
    </Routes>
  );
}
