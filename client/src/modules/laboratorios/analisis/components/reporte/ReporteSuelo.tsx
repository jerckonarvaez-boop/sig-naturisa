import { Bug, Layers } from 'lucide-react';
import { cientifico, fechaLegible, fmt, num, porcentaje, type InformeVista } from '../../logic/reporte';
import { Encabezado, Ficha, Firma, Metodos, Observaciones, Pie, Seccion } from './comunes';

/** Informe de Análisis de Suelo (AS): materia orgánica o bacteriológico */
export function ReporteSuelo({ informe, analisis }: { informe: InformeVista; analisis: string }) {
  const bacteriologico = informe.tipo === 'bacteriologia';
  return (
    <>
      <Encabezado informe={informe} />
      <Ficha
        datos={[
          ['Identificación de la muestra', `Suelo - ${informe.sucursal}`],
          ['Matriz', informe.matriz],
          [bacteriologico ? 'Fecha de análisis' : 'Fecha de muestreo', fechaLegible(informe.fechaMuestra)],
          ['Fecha de emisión', fechaLegible(informe.fechaEmision)],
          ['Análisis solicitado', analisis],
          ['Muestreado por', informe.muestreadoPor],
        ]}
      />

      {bacteriologico ? (
        <>
          <Seccion numero={1} titulo="Análisis bacteriológico del suelo" icono={Bug} nota="TCBS (Vibrios sp) · UFC/ml" />
          <table className="rep-tabla rep-estrecha">
            <thead>
              <tr>
                <th>Muestra</th>
                <th>Colonias amarillas</th>
                <th>Colonias verdes</th>
              </tr>
            </thead>
            <tbody>
              {informe.muestras.map((m, i) => (
                <tr key={i}>
                  <td className="rep-muestra">{m.nombre}</td>
                  <td>{cientifico(num(m.valores.vibrios_amarillas), 2)}</td>
                  <td>{cientifico(num(m.valores.vibrios_verdes), 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="rep-bloque">
            <div className="rep-subtitulo">Valores referenciales</div>
            <div className="rep-referencias">
              <div className="rep-ref celeste" style={{ flex: '0 0 320px' }}>
                <div className="rep-ref-titulo">Bacteriología</div>
                <table>
                  <thead>
                    <tr>
                      <th>Parámetro</th>
                      <th>Rango óptimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Vibrios</td>
                      <td>500 – 1000 UFC/ml</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <Metodos lineas={[['Bacteriológico', 'Siembra del suelo en medio sólido TCBS, con diluciones 1/10']]} />
        </>
      ) : (
        <>
          <Seccion numero={1} titulo="Análisis de suelo" icono={Layers} nota="Materia orgánica" />
          <table className="rep-tabla">
            <thead>
              <tr>
                <th>Piscina</th>
                <th>
                  Humedad<span className="rep-unidad">%</span>
                </th>
                <th>pH seco</th>
                <th>
                  Materia orgánica<span className="rep-unidad">%</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {informe.muestras.map((m, i) => (
                <tr key={i}>
                  <td className="rep-muestra">{m.nombre}</td>
                  <td>{porcentaje(num(m.valores.humedad))}</td>
                  <td>{fmt(num(m.valores.ph_seco), 2)}</td>
                  <td>{porcentaje(num(m.valores.materia_organica))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <Observaciones texto={informe.observaciones} />
      <Firma tecnico={informe.tecnico} />
      <Pie aviso="Los resultados corresponden únicamente a las muestras analizadas. Este informe no puede distribuirse, total ni parcialmente, sin autorización escrita de Naturisa. Las muestras se mantendrán por 7 días a partir de la fecha de entrega de los resultados." />
    </>
  );
}
