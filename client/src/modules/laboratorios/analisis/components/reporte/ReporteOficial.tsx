import { forwardRef } from 'react';
import { camposDelTipo, nombreTipo, partesDelTipo } from '../../logic/laboratorio';
import { horizontal, type InformeVista } from '../../logic/reporte';
import type { SeccionLab } from '../../types';
import { ReporteAgua } from './ReporteAgua';
import { ReportePatologia } from './ReportePatologia';
import { ReporteSuelo } from './ReporteSuelo';
import './reporte.css';

interface ReporteOficialProps {
  seccion: SeccionLab;
  informe: InformeVista;
}

/**
 * Informe de ensayo con el diseño oficial de cada formato (igual al Excel). Se dibuja fuera de pantalla:
 * es lo que sale al imprimir y lo que se convierte en PDF para enviar por correo.
 */
export const ReporteOficial = forwardRef<HTMLDivElement, ReporteOficialProps>(function ReporteOficial({ seccion, informe }, ref) {
  const apaisado = horizontal(seccion, informe);
  return (
    <div className="rep-contenedor" aria-hidden="true">
      {/* Tamaño de hoja al imprimir */}
      <style>{`@media print { @page { size: A4 ${apaisado ? 'landscape' : 'portrait'}; margin: 9mm; } }`}</style>
      <div ref={ref} className={`rep-pagina ${apaisado ? 'rep-horizontal' : ''}`}>
        {seccion.id === 'agua' && <ReporteAgua informe={informe} campos={seccion.campos} />}
        {seccion.id === 'suelo' && <ReporteSuelo informe={informe} analisis={nombreTipo(seccion, informe.tipo)} />}
        {seccion.id === 'patologia' && (
          <ReportePatologia
            informe={informe}
            condiciones={camposDelTipo(seccion, informe.tipo).filter((c) => c.escala === 'patologia')}
            conFresco={partesDelTipo(informe.tipo).includes('fresco')}
            conBacteriologia={partesDelTipo(informe.tipo).includes('bacteriologia')}
          />
        )}
      </div>
    </div>
  );
});
