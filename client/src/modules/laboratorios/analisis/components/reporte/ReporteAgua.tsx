import type { CSSProperties, ReactNode } from 'react';
import { CLAVES_FITOPLANCTON, partesDelTipo } from '../../logic/laboratorio';
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

/** Salinidad, pH y alcalinidad */
const BASICOS = ['salinidad', 'ph', 'alcalinidad'];

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

/** Título de una tabla del informe; la primera lleva el código a la derecha, como en el formato oficial */
function TituloSeccion({ children, codigo, style }: { children: ReactNode; codigo?: string; style?: CSSProperties }) {
  return (
    <div style={{ position: 'relative' }}>
      <div className="rep-subtitulo" style={style}>
        {children}
      </div>
      {codigo && (
        <span className="rep-codigo" style={{ position: 'absolute', right: '6%', top: 0 }}>
          {codigo}
        </span>
      )}
    </div>
  );
}

/** Informe de Análisis de Agua (AA): una, dos o las tres tablas (fitoplancton, químico, bacteriológico) */
export function ReporteAgua({ informe }: { informe: InformeVista }) {
  const partes = partesDelTipo(informe.tipo);
  const conFito = partes.includes('fitoplancton');
  const conQuimico = partes.includes('quimico');
  const conBacteriologia = partes.includes('bacteriologia');
  /** Formato del informe básico (solo fitoplancton) */
  const basico = conFito && !conQuimico && !conBacteriologia;
  /** Sin análisis químico, la salinidad, el pH y la alcalinidad (si se midieron) van en la tabla de fitoplancton */
  const basicosEnFito = conFito && !conQuimico && informe.muestras.some((m) => BASICOS.some((c) => num(m.valores[c]) != null));
  // Las tablas se numeran en el orden en que aparecen; la primera lleva el código
  const tablas = [conFito && 'fito', conQuimico && 'quimico', conBacteriologia && 'bact'].filter(Boolean);
  const numero = (t: string) => tablas.indexOf(t) + 1;
  const codigoEn = (t: string) => (tablas[0] === t ? informe.codigo : undefined);
  const refBasicas = conQuimico || basicosEnFito;
  const referencias = [refBasicas, conQuimico, conBacteriologia].filter(Boolean).length;

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

      {/* Fitoplancton */}
      {conFito && (
        <>
          <TituloSeccion codigo={codigoEn('fito')}>{numero('fito')}.- Análisis de Fitoplancton</TituloSeccion>
          <div className="rep-centro rep-negrita rep-pequeno" style={{ marginLeft: basicosEnFito ? 120 : 60 }}>
            Cel / ml (000)
          </div>
          <table className="rep-tabla rep-gruesa">
            <thead>
              <tr>
                <th>Muestras</th>
                {basicosEnFito && (
                  <>
                    <th>ppt</th>
                    <th>.pH</th>
                    <th>Alk</th>
                  </>
                )}
                {GRUPOS.map(([c, , completo, corto]) => (
                  <th key={c}>{basicosEnFito ? corto : completo}</th>
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
                    {basicosEnFito && (
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
        </>
      )}

      {/* Químico */}
      {conQuimico && (
        <>
          <TituloSeccion codigo={codigoEn('quimico')} style={{ textDecoration: 'underline' }}>
            {numero('quimico')}.- Análisis Químico de Agua.
          </TituloSeccion>
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
        </>
      )}

      {/* Bacteriológico */}
      {conBacteriologia && (
        <>
          <TituloSeccion codigo={codigoEn('bact')} style={{ textDecoration: 'underline', marginTop: 8 }}>
            {numero('bact')}.- Análisis Bacteriológico del Agua.
          </TituloSeccion>
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

      {/* Métodos (en el básico van al final, con título) */}
      {!basico && (
        <div className="rep-centro rep-pequeno" style={{ marginTop: 4 }}>
          {conFito && <div>Análisis de Fitoplancton.- Conteo directo al microscopio en Cámara New Bauer</div>}
          {refBasicas && <div>Análisis Químico.- Espectrofotometría (YSI-9300)</div>}
          {conBacteriologia && <div>Análisis Bacteriológico.- Siembra directa del agua en medio sólido TCBS</div>}
        </div>
      )}

      {/* Valores referenciales de las tablas que lleva el informe */}
      {referencias > 0 && (
        <>
          <div className="rep-subtitulo" style={{ marginTop: 8 }}>
            Valores {basico ? 'referenciales' : 'Referenciales'}
          </div>
          <div style={{ display: 'flex', justifyContent: referencias > 1 ? 'space-between' : 'center', alignItems: 'flex-start', gap: 12 }}>
            {refBasicas && (
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
                  {conQuimico && (
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
            )}
            {conQuimico && (
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
            )}
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
          </div>
        </>
      )}

      {basico && (
        <div className="rep-centro rep-pequeno" style={{ marginTop: 8 }}>
          <div className="rep-subtitulo">Métodos de análisis utilizado:</div>
          <div>Análisis de Fitoplancton.- Conteo directo al microscopio en Cámara New Bauer</div>
          {basicosEnFito && <div>Análisis Químico.- Espectrofotometría (YSI 9300)</div>}
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
