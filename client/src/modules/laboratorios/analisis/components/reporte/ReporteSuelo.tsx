import { fechaInforme, fmt, num, porcentaje, type InformeVista } from '../../logic/reporte';
import { DatosEncabezado, EncabezadoEnsayo, Firma, Pie } from './comunes';

/** Informe de Análisis de Suelo (AS) */
export function ReporteSuelo({ informe, analisis }: { informe: InformeVista; analisis: string }) {
  return (
    <>
      <EncabezadoEnsayo informe={informe} />
      <DatosEncabezado
        filas={[
          ['Fecha de emisión de Reporte:', fechaInforme(informe.fechaEmision)],
          ['Fecha de muestreo:', fechaInforme(informe.fechaMuestra)],
          ['Identificación de la muestra:', `Suelo - ${informe.sucursal}`, true],
          ['Matriz de la Muestra:', informe.matriz, true],
          ['Muestreado por:', informe.muestreadoPor],
          ['Análisis solicitado:', analisis, true],
        ]}
      />

      <div className="rep-titulo">Resultados</div>
      <div className="rep-subtitulo" style={{ marginBottom: 10 }}>
        Análisis de Suelo
      </div>
      <table className="rep-tabla rep-gruesa" style={{ fontFamily: 'Arial, sans-serif', fontSize: 10 }}>
        <thead>
          <tr>
            <td className="rep-sin-borde" colSpan={3} />
            <th style={{ borderBottom: '1px solid #000' }}>
              Materia
              <br />
              Orgánica
            </th>
          </tr>
          <tr>
            <th style={{ width: 96 }}>PISCINA</th>
            <th style={{ width: 66 }}>
              Humedad
              <br />
              (%)
            </th>
            <th style={{ width: 66 }}>pH seco</th>
            <th style={{ width: 66 }}>%</th>
          </tr>
        </thead>
        <tbody>
          {informe.muestras.map((m, i) => (
            <tr key={i} className="rep-centro">
              <td>{m.nombre}</td>
              <td>{porcentaje(num(m.valores.humedad))}</td>
              <td>{fmt(num(m.valores.ph_seco), 2)}</td>
              <td>{porcentaje(num(m.valores.materia_organica))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {informe.observaciones && (
        <p className="rep-pequeno" style={{ marginTop: 10 }}>
          <b>Observaciones:</b> {informe.observaciones}
        </p>
      )}
      <div style={{ height: 30 }} />
      <Firma tecnico={informe.tecnico} />
      <Pie aviso="Los resultados de este informe de ensayo solo son aplicables a las muestras analizadas. Este informe de ensayos no deberá ser reproducido más que en su totalidad con autorización escrita de Naturisa. Las muestras se mantendrán por 7 días a partir de la fecha de entrega de los resultados." />
    </>
  );
}
