import { cientifico, fechaInforme, fmt, num, porcentaje, type InformeVista } from '../../logic/reporte';
import { DatosEncabezado, EncabezadoEnsayo, Firma, Pie } from './comunes';

/** Informe de Análisis de Suelo (AS): materia orgánica o bacteriológico */
export function ReporteSuelo({ informe, analisis }: { informe: InformeVista; analisis: string }) {
  const bacteriologico = informe.tipo === 'bacteriologia';
  return (
    <>
      <EncabezadoEnsayo informe={informe} />
      <DatosEncabezado
        filas={[
          ['Fecha de emisión de Reporte:', fechaInforme(informe.fechaEmision)],
          [bacteriologico ? 'Fecha de análisis:' : 'Fecha de muestreo:', fechaInforme(informe.fechaMuestra)],
          ['Identificación de la muestra:', `Suelo - ${informe.sucursal}`, true],
          ['Matriz de la Muestra:', informe.matriz, true],
          ['Muestreado por:', informe.muestreadoPor],
          ['Análisis solicitado:', analisis, true],
        ]}
      />

      <div className="rep-titulo">Resultados</div>
      <div className="rep-subtitulo" style={{ marginBottom: 10 }}>
        {bacteriologico ? 'Análisis Bacteriológico del Suelo' : 'Análisis de Suelo'}
      </div>
      {bacteriologico ? <TablaBacteriologia informe={informe} /> : <TablaMateriaOrganica informe={informe} />}

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

function TablaMateriaOrganica({ informe }: { informe: InformeVista }) {
  return (
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
  );
}

/** Vibrios en suelo: colonias amarillas (A) y verdes (V) por muestra, con su método y valor referencial */
function TablaBacteriologia({ informe }: { informe: InformeVista }) {
  return (
    <>
      <table className="rep-tabla rep-gruesa rep-compacta" style={{ minWidth: 220 }}>
        <thead>
          <tr>
            <th colSpan={3}>TCBS (Vibrios sp)</th>
          </tr>
          <tr>
            <th rowSpan={2}>Muestras</th>
            <th colSpan={2}>Ufc/ml</th>
          </tr>
          <tr>
            <th>A</th>
            <th>V</th>
          </tr>
        </thead>
        <tbody>
          {informe.muestras.map((m, i) => (
            <tr key={i} className="rep-centro">
              <td style={{ padding: '0 5px' }}>{m.nombre}</td>
              <td>{cientifico(num(m.valores.vibrios_amarillas), 2)}</td>
              <td>{cientifico(num(m.valores.vibrios_verdes), 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rep-centro rep-pequeno" style={{ marginTop: 4 }}>
        Análisis Bacteriológico.- Siembra del suelo en medio sólido TCBS, con diluciones 1/10
      </div>
      <div className="rep-subtitulo" style={{ marginTop: 8 }}>
        Valores Referenciales
      </div>
      <table className="rep-tabla rep-compacta" style={{ minWidth: 220 }}>
        <thead>
          <tr>
            <th>Parámetro</th>
            <th>Rango óptimo</th>
            <th>Unidad</th>
          </tr>
        </thead>
        <tbody>
          <tr className="rep-centro">
            <td>Vibrio</td>
            <td>500 - 1000</td>
            <td>UFC/ml</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
