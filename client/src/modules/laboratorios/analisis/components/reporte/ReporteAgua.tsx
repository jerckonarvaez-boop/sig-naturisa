import { CLAVES_FITOPLANCTON } from '../../logic/laboratorio';
import { cientifico, fechaInforme, fmt, num, txt, type InformeVista } from '../../logic/reporte';
import { Firma, LEYENDA_FITOPLANCTON, LOGO, Pie } from './comunes';

type Muestra = InformeVista['muestras'][number];

const GRUPOS: [string, string, string, string][] = [
  // clave del conteo, clave de géneros, encabezado completo, encabezado básico
  ['diatomeas', 'generos_diatomeas', 'Diatom.', 'Diatom.'],
  ['cianofitas', 'generos_cianofitas', 'Cianofit.', 'Cianfitas'],
  ['clorofitas', 'generos_clorofitas', 'Clorofit.', 'Clorofitas'],
  ['dinoflagelados', 'generos_dinoflagelados', 'Dinoflag.', 'Dinoflag.'],
  ['otros_fito', 'generos_otros', 'Otros', 'Otros'],
];

const QUIMICOS: [string, string, string | null][] = [
  ['fosfato', 'PO₄⁻³', 'mg/L'],
  ['amonio', 'N-NH₄', 'mg/L'],
  ['nitrito', 'NO²⁻', 'mg/L'],
  ['nitrato', 'NO³⁻', 'mg/L'],
  ['calcio', 'Ca++', 'mg/L'],
  ['magnesio', 'Mg++', 'mg/L'],
  ['potasio', 'K+', 'mg/L'],
];

const totalFito = (m: Muestra) => CLAVES_FITOPLANCTON.reduce((t, c) => t + (num(m.valores[c]) ?? 0), 0);

/** Celda de un grupo de fitoplancton: conteo, % del total y géneros ("+" si hay géneros sin conteo, "-" si no se encontró) */
function CeldaFito({ m, conteo, generos }: { m: Muestra; conteo: string; generos: string }) {
  const n = num(m.valores[conteo]);
  const g = txt(m.valores[generos]);
  const total = totalFito(m);
  return (
    <td className="rep-celda-fito">
      {n ? (
        <>
          <div>{fmt(n)}</div>
          <div>{total ? `${Math.round((n / total) * 100)}%` : ''}</div>
        </>
      ) : (
        <div style={{ paddingTop: 7 }}>{g ? '+' : '-'}</div>
      )}
      <span className="rep-generos">{g}</span>
    </td>
  );
}

/** Informe de Análisis de Agua (AA): con químicos y bacteriología, con todos los químicos, o básico */
export function ReporteAgua({ informe }: { informe: InformeVista }) {
  const basico = informe.tipo === 'basico';
  const conBacteriologia = informe.tipo === 'completo';
  return (
    <>
      {/* Encabezado */}
      <table className="rep-caja" style={{ width: '88%', margin: '0 auto', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 8px', width: '56%' }}>
              Fecha de emisión de Reporte:
              <br />
              Identificación de la muestra:
              <br />
              Matriz de la Muestra:
              <br />
              Fecha de Análisis:
            </td>
            <td style={{ padding: '6px 0' }}>
              {fechaInforme(informe.fechaEmision)}
              <br />
              <b>{informe.sucursal}</b>
              <br />
              {informe.matriz}
              <br />
              {fechaInforme(informe.fechaMuestra)}
            </td>
            <td className="rep-derecha" style={{ padding: '4px 8px' }}>
              <img src={LOGO} alt="Naturisa" className="rep-logo" style={{ height: 52 }} />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="rep-titulo">Resultados</div>
      <div style={{ position: 'relative' }}>
        <div className="rep-subtitulo">1.- Análisis de Fitoplancton</div>
        <span className="rep-codigo" style={{ position: 'absolute', right: '6%', top: 0 }}>
          {informe.codigo}
        </span>
      </div>
      <div className="rep-centro rep-negrita rep-pequeno" style={{ marginLeft: basico ? 120 : 60 }}>
        Cel / ml (000)
      </div>

      {/* 1. Fitoplancton */}
      <table className="rep-tabla rep-gruesa">
        <thead>
          <tr>
            <th>Muestras</th>
            {basico && (
              <>
                <th>ppt</th>
                <th>.pH</th>
                <th>Alk</th>
              </>
            )}
            {GRUPOS.map(([c, , completo, corto]) => (
              <th key={c}>{basico ? corto : completo}</th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {informe.muestras.map((m, i) => {
            const total = totalFito(m);
            return (
              <tr key={i}>
                <td className="rep-muestra" style={{ minWidth: 62 }}>
                  {m.nombre}
                </td>
                {basico && (
                  <>
                    <td className="rep-centro rep-negrita">{fmt(num(m.valores.salinidad))}</td>
                    <td className="rep-centro rep-negrita">{fmt(num(m.valores.ph), 2)}</td>
                    <td className="rep-centro rep-negrita">{fmt(num(m.valores.alcalinidad))}</td>
                  </>
                )}
                {GRUPOS.map(([c, g]) => (
                  <CeldaFito key={c} m={m} conteo={c} generos={g} />
                ))}
                <td className="rep-centro rep-negrita" style={{ verticalAlign: 'top' }}>
                  <div>{total ? fmt(total) : '-'}</div>
                  <div>{total ? '100%' : ''}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="rep-muy-pequeno" style={{ width: 360, margin: '3px auto 0' }}>
        {LEYENDA_FITOPLANCTON.map(([s, t]) => (
          <div key={s}>
            <span style={{ display: 'inline-block', width: 18, textAlign: 'right' }}>{s}</span> {t}
          </div>
        ))}
      </div>

      {!basico && (
        <>
          {/* 2. Químico */}
          <div className="rep-subtitulo" style={{ textDecoration: 'underline' }}>
            2.- Análisis Químico de Agua.
          </div>
          <table className="rep-tabla rep-gruesa rep-compacta" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Muestras</th>
                <th>ppt</th>
                <th>ph</th>
                <th>Alcalinidad</th>
                {QUIMICOS.map(([c, nombre, unidad]) => (
                  <th key={c}>
                    {nombre}
                    {unidad && <div className="rep-muy-pequeno">{unidad}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {informe.muestras.map((m, i) => (
                <tr key={i} className="rep-centro">
                  <td className="rep-negrita">{m.nombre}</td>
                  <td>{fmt(num(m.valores.salinidad))}</td>
                  <td>{fmt(num(m.valores.ph), 2)}</td>
                  <td>{fmt(num(m.valores.alcalinidad))}</td>
                  {QUIMICOS.map(([c]) => (
                    <td key={c}>{fmt(num(m.valores[c]))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* 3. Bacteriología (solo en el informe completo) */}
          {conBacteriologia && (
            <>
              <div className="rep-subtitulo" style={{ textDecoration: 'underline', marginTop: 8 }}>
                3.- Análisis Bacteriológico del Agua.
              </div>
              <table className="rep-tabla rep-gruesa rep-compacta" style={{ minWidth: 190 }}>
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
                      <td className="rep-muestra" style={{ padding: '0 5px' }}>
                        {m.nombre}
                      </td>
                      <td>{cientifico(num(m.valores.vibrios_amarillas), 2)}</td>
                      <td>{cientifico(num(m.valores.vibrios_verdes), 2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <div className="rep-centro rep-pequeno" style={{ marginTop: 4 }}>
            <div>Análisis de Fitoplancton.- Conteo directo al microscopio en Cámara New Bauer</div>
            <div>Análisis Químico.- Espectrofotometría (YSI-9300)</div>
            {conBacteriologia && <div>Análisis Bacteriológico.- Siembra directa del agua en medio sólido TCBS</div>}
          </div>
        </>
      )}

      {/* Valores referenciales */}
      <div className="rep-subtitulo" style={{ marginTop: 8 }}>
        Valores {basico ? 'referenciales' : 'Referenciales'}
      </div>
      <div style={{ display: 'flex', justifyContent: basico ? 'center' : 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <table className="rep-ref verde">
          <thead>
            <tr>
              <th>Parámetro</th>
              <th>Fórmula</th>
              <th>Valor {basico ? '' : 'referencial'}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>pH</td>
              <td className="rep-negrita">pH</td>
              <td>7 – 8</td>
            </tr>
            <tr>
              <td>Alcalinidad</td>
              <td className="rep-negrita">Alk</td>
              <td>100-140 mg/l</td>
            </tr>
            {!basico && (
              <>
                <tr>
                  <td>Amonio</td>
                  <td className="rep-negrita">NH₄</td>
                  <td>0.1 – 1.0 mg/l</td>
                </tr>
                <tr>
                  <td>Fosfato</td>
                  <td className="rep-negrita">PO₄</td>
                  <td>0.6 – 1.5 mg/l</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        {!basico && (
          <>
            <div>
              <table className="rep-ref morado">
                <thead>
                  <tr>
                    <th>Parámetro</th>
                    <th>Nomenclatura</th>
                    <th className="rep-muy-pequeno">
                      Valor determinado
                      <br />
                      dependiendo la salinidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Calcio', 'Ca', '11,6'],
                    ['Potasio', 'K', '10,7'],
                    ['Magnesio', 'Mg', '39,1'],
                  ].map(([p, n, v]) => (
                    <tr key={p}>
                      <td>{p}</td>
                      <td className="rep-negrita">{n}</td>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="rep-muy-pequeno" style={{ width: 230, marginTop: 6 }}>
                <b>Observaciones:</b> Multiplicar el valor determinado por el de la salinidad para obtener el número referencial.
              </div>
            </div>
            {conBacteriologia && (
              <table className="rep-ref celeste">
                <thead>
                  <tr>
                    <th>Parámetro</th>
                    <th>
                      Rango
                      <br />
                      óptimo
                    </th>
                    <th>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Vibrio</td>
                    <td>500 - 1000</td>
                    <td>UFC/ml</td>
                  </tr>
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {basico && (
        <div className="rep-centro rep-pequeno" style={{ marginTop: 8 }}>
          <div className="rep-subtitulo">Métodos de análisis utilizado:</div>
          <div>Análisis de Fitoplancton.- Conteo directo al microscopio en Cámara New Bauer</div>
          <div>Análisis Químico.- Espectrofotometría (YSI 9300)</div>
        </div>
      )}

      {informe.observaciones && (
        <p className="rep-pequeno" style={{ marginTop: 8 }}>
          <b>Observaciones:</b> {informe.observaciones}
        </p>
      )}
      <Firma tecnico={informe.tecnico} />
      <Pie aviso="Este reporte corresponde únicamente a las muestras analizadas y no deberá ser reproducido más que en su totalidad, con autorización de Naturisa." />
    </>
  );
}
