// Piezas comunes del informe oficial: encabezados, firma y pie.
import type { ReactNode } from 'react';
import type { InformeVista } from '../../logic/reporte';

export const LOGO = '/logo-naturisa-lab.jpeg';

const DIRECCION = ['Instalaciones: Camaronera Naturisa - Isla Josefina - Sector las Exclusas', 'Oficina: Colombia 101 y la Ría - Teléfono 6005360', 'Guayaquil-Ecuador'];

/** Encabezado "NATURISA · Laboratorio de Análisis | INFORME DE ENSAYOS · código" (suelo y patología) */
export function EncabezadoEnsayo({ informe }: { informe: InformeVista }) {
  return (
    <>
      <table className="rep-caja" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td className="rep-centro" style={{ width: '58%', borderRight: '2px solid #000', padding: '10px 4px' }}>
              <div className="rep-negrita" style={{ fontSize: 13 }}>
                NATURISA
              </div>
              <div>Laboratorio de Análisis</div>
            </td>
            <td className="rep-centro" style={{ padding: '10px 4px' }}>
              <div style={{ fontSize: 13, fontStyle: 'italic' }}>INFORME DE ENSAYOS</div>
              <div>{informe.codigo}</div>
            </td>
          </tr>
        </tbody>
      </table>
      <div className="rep-linea" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '8px 0 4px' }}>
        <div>
          <div className="rep-negrita">NATURISA S.A.</div>
          <div>Colombia 101 y la Ría</div>
          <div>Guayaquil</div>
        </div>
        <img src={LOGO} alt="Naturisa" className="rep-logo" />
      </div>
    </>
  );
}

/** Filas "Etiqueta: valor" del encabezado */
export function DatosEncabezado({ filas }: { filas: [string, ReactNode, boolean?][] }) {
  return (
    <table className="rep-linea" style={{ width: '100%', borderCollapse: 'collapse', margin: '6px 0 10px' }}>
      <tbody>
        {filas.map(([etiqueta, valor, negrita]) => (
          <tr key={etiqueta}>
            <td style={{ width: '58%', padding: '0 0 1px' }}>{etiqueta}</td>
            <td className={negrita ? 'rep-negrita' : ''}>{valor}</td>
          </tr>
        ))}
        <tr>
          <td colSpan={2} style={{ height: 6 }} />
        </tr>
      </tbody>
    </table>
  );
}

export function Firma({ tecnico, empresa = 'Naturisa' }: { tecnico: string; empresa?: string }) {
  return (
    <div className="rep-firma">
      <div className="rep-negrita">{tecnico || ' '}</div>
      <div>Técnico de laboratorio</div>
      <div className="rep-negrita">{empresa}</div>
    </div>
  );
}

export function Pie({ aviso }: { aviso: string }) {
  return (
    <div className="rep-pie">
      <div>{aviso}</div>
      {DIRECCION.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );
}

export const LEYENDA_FITOPLANCTON = [
  ['+', 'Significa que se ha encontrado presencia del organismo, en una cantidad baja.'],
  ['++', 'Significa que se ha encontrado presencia del organismo en una cantidad media.'],
  ['+++', 'Significa que se ha encontrado presencia del organismo en una cantidad alta.'],
  ['-', 'No se encontró'],
];
