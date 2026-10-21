import { fechaNumerica } from '@/utils/fechas';
import { parametroDe } from '../../logic/monitoreo';
import type { DefinicionMonitoreo, Resultado } from '../../types';
import './informe.css';

export const COLUMNAS_APENDICE = [
  'Date',
  'Analysis (TP, TN, BOD, TSS, etc.)',
  'Location (Effluent, Inlet, etc.)',
  'Method (Single grab, 24-hour bulk, etc.)',
  'Sampling by Third Party? (Yes/No)',
  'Analysis by Third Party? (Yes/No)',
  'Result',
  'Units',
];

const PUNTO = { afluente: 'Afluente', efluente: 'Efluente' } as const;

/** Filas del Apéndice X: una por parámetro de cada resultado (afluente y efluente), en orden de fecha */
export function filasApendice(resultados: Resultado[], definicion: DefinicionMonitoreo) {
  return [...resultados]
    .sort((a, b) => a.fechaMuestreo.localeCompare(b.fechaMuestreo) || a.punto.localeCompare(b.punto))
    .flatMap((r) =>
      r.valores
        .filter((v) => v.valor.trim())
        .map((v, i) => ({
          primera: i === 0,
          resultadoId: r.id,
          fecha: fechaNumerica(r.fechaMuestreo),
          analisis: parametroDe(definicion, v.clave)?.nombre ?? v.clave,
          ubicacion: [PUNTO[r.punto], r.locacion].filter(Boolean).join(' - '),
          metodo: !r.metodo || /^simple$/i.test(r.metodo) ? 'Single Grab' : r.metodo,
          muestreoTercero: r.muestreoTercero ? 'Sí' : 'No',
          analisisTercero: 'Sí',
          resultado: v.valor,
          unidad: parametroDe(definicion, v.clave)?.unidad ?? '',
        })),
    );
}

interface ApendiceXProps {
  titulo: string;
  resultados: Resultado[];
  definicion: DefinicionMonitoreo;
}

/** Appendix X (ASC): metodología de muestreo y datos de calidad de agua de una camaronera en el año */
export function ApendiceX({ titulo, resultados, definicion }: ApendiceXProps) {
  const filas = filasApendice(resultados, definicion);
  return (
    <div className="pgc-hoja pgc-horizontal">
      <style>{'@media print { @page { size: A4 landscape; margin: 12mm; } }'}</style>
      <div className="pgc-epigrafe" style={{ fontSize: 14, marginTop: 0 }}>
        {titulo}
      </div>
      <div className="pgc-epigrafe" style={{ fontSize: 12 }}>
        Appendix X: Water quality sampling methodology and data sharing
      </div>
      <table className="pgc-tabla pgc-apendice">
        <thead>
          <tr>
            {COLUMNAS_APENDICE.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={`${f.resultadoId}-${i}`} className={f.primera && i > 0 ? 'pgc-separador' : ''}>
              <td className="pgc-centro">{f.primera ? f.fecha : ''}</td>
              <td>{f.analisis}</td>
              <td className="pgc-centro">{f.primera ? f.ubicacion : ''}</td>
              <td className="pgc-centro">{f.primera ? f.metodo : ''}</td>
              <td className="pgc-centro">{f.primera ? f.muestreoTercero : ''}</td>
              <td className="pgc-centro">{f.primera ? f.analisisTercero : ''}</td>
              <td className="pgc-centro">{f.resultado}</td>
              <td className="pgc-centro">{f.unidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
