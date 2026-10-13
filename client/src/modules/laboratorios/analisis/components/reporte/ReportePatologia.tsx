import { cientifico, claseGrado, fechaInforme, grado, num, txt, type InformeVista } from '../../logic/reporte';
import type { CampoLab } from '../../types';
import { DatosEncabezado, EncabezadoEnsayo, Firma, Pie } from './comunes';

/** Nombres de las condiciones tal como aparecen en el informe oficial */
const NOMBRE_OFICIAL: Record<string, string> = {
  deformidad_tubulos: 'Deformidad en Túbulos del Hepatop.',
  lipidos: 'Lípidos en Hepatopáncreas',
  baculovirus: 'Hepatopáncreas: Baculovirus',
  vermiformes_hp: 'Cuerpos Vermiformes en Hepatop.',
  epibiontes: 'Epibiontes en Branquias y Apéndices',
  necrosis_branquial: 'Necrosis branquial',
  gregarinas: 'Tracto digestivo: Gregarinas',
  nematodos: 'Tracto digestivo: Nematodos',
  vermiformes_intestino: 'Cuerpos Vermiformes en Intestin.',
  diatomeas_td: 'Tracto digestivo: Diatomeas',
  cianofitas_td: 'Tracto digestivo: Cianofitas',
};

const BACTERIOLOGIA: [string, string, string, string][] = [
  // título, clave amarillas, clave verdes, unidad
  ['1.1.- Análisis Bacteriológico Hepatopáncreas - Camarón', 'hp_amarillas', 'hp_verdes', 'Ufc/g'],
  ['1.2.- Análisis Bacteriológico Estómago - Camarón', 'est_amarillas', 'est_verdes', 'Ufc/g'],
  ['1.3.- Análisis Bacteriológico - Hemolinfa', 'hem_amarillas', 'hem_verdes', 'Ufc/ml'],
];

interface ReportePatologiaProps {
  informe: InformeVista;
  /** Las 11 condiciones con grado (en el orden de la definición) */
  condiciones: CampoLab[];
  conBacteriologia: boolean;
}

/** Informe de Patologías en fresco (AF): una o varias muestras, con o sin bacteriología */
export function ReportePatologia({ informe, condiciones, conBacteriologia }: ReportePatologiaProps) {
  const muestras = informe.muestras;
  const una = muestras.length === 1;
  const columnas = muestras.length + 1 + (una ? 1 : 0);
  const notas = muestras.map((m) => txt(m.valores.notas)).filter(Boolean);

  return (
    <>
      <EncabezadoEnsayo informe={informe} />
      <DatosEncabezado
        filas={[
          ['Fecha de recepción:', fechaInforme(informe.fechaMuestra, 'larga')],
          ['Fecha de emisión del reporte:', fechaInforme(informe.fechaEmision, 'larga')],
          ['Identificación de la muestra:', informe.sucursal, true],
          ['Matriz de la Muestra:', informe.matriz],
          ['Muestreado por:', informe.muestreadoPor],
        ]}
      />

      <table className="rep-tabla" style={{ width: '100%', fontFamily: 'Verdana, Arial, sans-serif', fontSize: una ? 11 : 10 }}>
        <tbody>
          {conBacteriologia && (
            <>
              <tr>
                <td colSpan={columnas} className="rep-barra rep-centro">
                  1.- Bacteriología
                </td>
              </tr>
              {BACTERIOLOGIA.map(([titulo, amarillas, verdes, unidad]) => {
                const hay = muestras.some((m) => num(m.valores[amarillas]) != null || num(m.valores[verdes]) != null);
                if (!hay && titulo.startsWith('1.3')) return null; // la hemolinfa solo si se analizó
                return [
                  <tr key={titulo}>
                    <td colSpan={columnas} className="rep-barra rep-centro" style={{ background: '#fff' }}>
                      {titulo}
                    </td>
                  </tr>,
                  <tr key={`${titulo}-enc`}>
                    <td className="rep-negrita rep-centro">{una ? 'Medio de Cultivo' : ''}</td>
                    {muestras.map((m, i) => (
                      <td key={i} className="rep-negrita rep-centro">
                        {m.nombre}
                        <div style={{ fontWeight: 400 }}>{unidad}</div>
                      </td>
                    ))}
                    {una && <td className="rep-negrita rep-centro">Observaciones</td>}
                  </tr>,
                  ...[
                    [amarillas, 'C. Amarillas', 'A- Colonias Color Amarillas'],
                    [verdes, 'C. Verdes', 'V- Colonias Color Verdes'],
                  ].map(([clave, corto, largo]) => (
                    <tr key={`${titulo}-${clave}`}>
                      <td>{una ? 'TCBS (Vibrios sp)' : `TCBS (Vibrios sp), ${corto}`}</td>
                      {muestras.map((m, i) => (
                        <td key={i} className="rep-centro rep-negrita">
                          {cientifico(num(m.valores[clave]))}
                        </td>
                      ))}
                      {una && <td className="rep-pequeno">{largo}</td>}
                    </tr>
                  )),
                ];
              })}
            </>
          )}

          <tr>
            <td colSpan={columnas} className="rep-barra" style={{ textAlign: una ? 'center' : 'left' }}>
              {conBacteriologia ? '2' : '1'}.- Análisis en Fresco
            </td>
          </tr>
          <tr>
            <td className="rep-negrita rep-centro" style={{ fontSize: 12 }}>
              Condición/Patología
            </td>
            {muestras.map((m, i) => (
              <td key={i} className="rep-negrita rep-centro" style={{ fontSize: 12, minWidth: 74 }}>
                {m.nombre}
                {una && <div style={{ fontWeight: 400, fontSize: 10 }}>Grado</div>}
              </td>
            ))}
            {una && <td className="rep-negrita rep-centro">Observaciones</td>}
          </tr>
          {condiciones.map((c, fila) => (
            <tr key={c.clave}>
              <td style={{ whiteSpace: 'nowrap' }}>{NOMBRE_OFICIAL[c.clave] ?? c.etiqueta}</td>
              {muestras.map((m, i) => {
                const v = num(m.valores[c.clave]);
                return (
                  <td key={i} className={`rep-centro ${claseGrado(v)}`} style={{ fontSize: 12 }}>
                    {grado(v)}
                  </td>
                );
              })}
              {una && fila === 0 && (
                <td rowSpan={condiciones.length} className="rep-pequeno" style={{ verticalAlign: 'top', maxWidth: 220 }}>
                  {notas[0]}
                </td>
              )}
            </tr>
          ))}
          <tr>
            <td>Otros</td>
            {muestras.map((m, i) => (
              <td key={i} className="rep-centro rep-pequeno">
                {txt(m.valores.otros)}
              </td>
            ))}
            {una && <td />}
          </tr>
          <tr>
            <td style={{ height: 40 }}>Apariencia Externa</td>
            {muestras.map((m, i) => (
              <td key={i} className="rep-centro rep-muy-pequeno rep-negrita">
                {txt(m.valores.apariencia)
                  .split(/\s*·\s*|\n/)
                  .filter(Boolean)
                  .map((l) => (
                    <div key={l}>{l}</div>
                  ))}
              </td>
            ))}
            {una && <td />}
          </tr>
          {!una && notas.length > 0 && (
            <tr>
              <td>Observaciones</td>
              {muestras.map((m, i) => (
                <td key={i} className="rep-centro rep-muy-pequeno">
                  {txt(m.valores.notas)}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>

      <div className="rep-leyenda">
        Patología en fresco: 0 = Ausencia; 0.1 - 0.9 = Bajo; 1.0 - 1,9 = Medio; 2.0 - 2.9 = Alto; 3.0 - 4.0 = Muy Alto.
        {conBacteriologia && <div>inc. = Incontables colonias.</div>}
      </div>
      <div className="rep-pequeno" style={{ marginTop: 4, fontFamily: 'Arial, sans-serif' }}>
        <div className="rep-negrita">Método de análisis utilizado:</div>
        <div>Patología en fresco: Observación directa al microscopio de montajes en fresco de muestras de Camarón.</div>
        {conBacteriologia && <div className="rep-negrita">Bacteriología: Siembra en medio sólido de TCBS, y dilución de macerado de hepatopáncreas y estómago.</div>}
      </div>
      {informe.observaciones && (
        <p className="rep-pequeno" style={{ marginTop: 6 }}>
          <b>Observaciones:</b> {informe.observaciones}
        </p>
      )}

      <Firma tecnico={informe.tecnico} empresa="Naturisa S.A." />
      <Pie aviso="Este reporte corresponde a los resultados de esta muestra y no deberá ser reproducido más que en su totalidad, con autorización escrita de Naturisa." />
    </>
  );
}
