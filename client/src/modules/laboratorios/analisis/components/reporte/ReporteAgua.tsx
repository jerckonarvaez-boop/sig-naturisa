import type { ReactNode } from 'react';
import { Bug, FlaskConical, Sprout } from 'lucide-react';
import { CLAVES_FITOPLANCTON, ESTADOS_REFERENCIA, estadoReferencia, partesDelTipo, quimicosDelInforme, type EstadoReferencia } from '../../logic/laboratorio';
import { cientifico, fechaLegible, fmt, num, txt, type InformeVista } from '../../logic/reporte';
import type { CampoLab } from '../../types';
import { Encabezado, Ficha, Firma, LEYENDA_FITOPLANCTON, LeyendaReferencia, Metodos, Observaciones, Pie, Seccion } from './comunes';

type Muestra = InformeVista['muestras'][number];

const GRUPOS: [string, string, string][] = [
  // clave del conteo, clave de géneros, encabezado
  ['diatomeas', 'generos_diatomeas', 'Diatomeas'],
  ['cianofitas', 'generos_cianofitas', 'Cianofitas'],
  ['clorofitas', 'generos_clorofitas', 'Clorofitas'],
  ['dinoflagelados', 'generos_dinoflagelados', 'Dinoflagelados'],
  ['otros_fito', 'generos_otros', 'Otros'],
];

/** Número de una referencia con coma decimal (0,6 · 1,5…) */
const ref = (n: number) => String(n).replace('.', ',');

/** Valor referencial de un parámetro químico: "0,1 – 1 mg/L", "máx. 2 mg/L" o "mín. 5 mg/L" */
function textoRango(c: CampoLab) {
  const unidad = c.unidad ? ` ${c.unidad}` : '';
  if (c.min != null && c.max != null) return `${ref(c.min)} – ${ref(c.max)}${unidad}`;
  if (c.max != null) return `máx. ${ref(c.max)}${unidad}`;
  return `mín. ${ref(c.min!)}${unidad}`;
}

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
          <div className="rep-conteo">{fmt(n)}</div>
          {total > 0 && <span className="rep-porcentaje">{Math.round((n / total) * 100) || '<1'}%</span>}
        </>
      ) : (
        <div>{g ? '+' : '-'}</div>
      )}
      {/* Un género por renglón, en columna */}
      {g && (
        <span className="rep-generos">
          {g
            .split(/\s+/)
            .filter(Boolean)
            .map((x, i) => (
              <span key={i} style={{ display: 'block' }}>
                {x}
              </span>
            ))}
        </span>
      )}
    </td>
  );
}

/** Celda de un valor con referencia: fuera de ella lleva fondo de color, negrita y flecha (▲ supera / ▼ no llega) */
function CeldaValor({ estado, className = '', children }: { estado: EstadoReferencia | null; className?: string; children: ReactNode }) {
  return (
    <td className={`${className} ${estado ? `rep-${estado}` : ''}`}>
      {children}
      {estado && <span className="rep-flecha">{ESTADOS_REFERENCIA[estado].flecha}</span>}
    </td>
  );
}

/** Informe de Análisis de Agua (AA): una, dos o las tres tablas (fitoplancton, químico, bacteriológico) */
export function ReporteAgua({ informe, campos }: { informe: InformeVista; campos: CampoLab[] }) {
  const porClave = new Map(campos.map((c) => [c.clave, c]));
  // Parámetros químicos que lleva el informe (elegidos al hacerlo; en los anteriores, los de Configuración)
  const quimicos = quimicosDelInforme(
    campos,
    informe.parametros,
    informe.muestras.map((m) => ({ valores: Object.fromEntries(Object.entries(m.valores).filter(([, v]) => num(v) != null)) })),
  );
  const conRango = quimicos.filter((c) => !c.factorSalinidad && (c.min != null || c.max != null));
  const conFactor = quimicos.filter((c) => c.factorSalinidad);
  /** Indicador del valor frente a su referencia (pH, alcalinidad, amonio, fosfato, Ca, Mg, K, Vibrios) */
  const estado = (m: Muestra, clave: string) => {
    const campo = porClave.get(clave);
    return campo ? estadoReferencia(campo, num(m.valores[clave]), num(m.valores.salinidad)) : null;
  };
  const hayFuera = informe.muestras.some((m) => campos.some((c) => estado(m, c.clave)));
  const partes = partesDelTipo(informe.tipo);
  const conFito = partes.includes('fitoplancton');
  const conQuimico = partes.includes('quimico');
  const conBacteriologia = partes.includes('bacteriologia');
  /** Sin análisis químico, la salinidad, el pH y la alcalinidad (si se midieron) van en la tabla de fitoplancton */
  const basicosEnFito = conFito && !conQuimico && informe.muestras.some((m) => BASICOS.some((c) => num(m.valores[c]) != null));
  // Las secciones se numeran en el orden en que aparecen
  const tablas = [conFito && 'fito', conQuimico && 'quimico', conBacteriologia && 'bact'].filter(Boolean);
  const numero = (t: string) => tablas.indexOf(t) + 1;
  const refBasicas = conQuimico || basicosEnFito;
  const hayReferencias = refBasicas || conBacteriologia;

  return (
    <>
      <Encabezado informe={informe} />
      <Ficha
        datos={[
          ['Identificación de la muestra', informe.sucursal],
          ['Matriz', informe.matriz],
          ['Fecha de análisis', fechaLegible(informe.fechaMuestra)],
          ['Fecha de emisión', fechaLegible(informe.fechaEmision)],
        ]}
      />

      {/* Fitoplancton */}
      {conFito && (
        <>
          <Seccion numero={numero('fito')} titulo="Análisis de fitoplancton" icono={Sprout} nota="Células / mL (miles)" />
          <table className="rep-tabla">
            <thead>
              <tr>
                <th>Muestra</th>
                {basicosEnFito && (
                  <>
                    <th>
                      Salinidad<span className="rep-unidad">ppt</span>
                    </th>
                    <th>pH</th>
                    <th>
                      Alcalinidad<span className="rep-unidad">mg/L</span>
                    </th>
                  </>
                )}
                {GRUPOS.map(([c, , nombre]) => (
                  <th key={c}>{nombre}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {informe.muestras.map((m, i) => {
                const total = totalFito(m);
                return (
                  <tr key={i}>
                    <td className="rep-muestra">{m.nombre}</td>
                    {basicosEnFito && (
                      <>
                        <td>{fmt(num(m.valores.salinidad))}</td>
                        <CeldaValor estado={estado(m, 'ph')}>{fmt(num(m.valores.ph), 2)}</CeldaValor>
                        <CeldaValor estado={estado(m, 'alcalinidad')}>{fmt(num(m.valores.alcalinidad))}</CeldaValor>
                      </>
                    )}
                    {GRUPOS.map(([c, g]) => (
                      <CeldaFito key={c} m={m} conteo={c} generos={g} />
                    ))}
                    <td className="rep-total">{total ? fmt(total) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="rep-nota-tabla">
            {LEYENDA_FITOPLANCTON.map(([s, t]) => (
              <span key={s}>
                <b>{s}</b> {t}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Químico */}
      {conQuimico && (
        <>
          <Seccion numero={numero('quimico')} titulo="Análisis químico del agua" icono={FlaskConical} />
          <table className="rep-tabla">
            <thead>
              <tr>
                <th>Muestra</th>
                <th>
                  Salinidad<span className="rep-unidad">ppt</span>
                </th>
                <th>pH</th>
                <th>
                  Alcalinidad<span className="rep-unidad">mg/L</span>
                </th>
                {quimicos.map((c) => (
                  <th key={c.clave}>
                    {c.formula || c.nombre || c.etiqueta}
                    {c.unidad && <span className="rep-unidad">{c.unidad}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {informe.muestras.map((m, i) => (
                <tr key={i}>
                  <td className="rep-muestra">{m.nombre}</td>
                  <td>{fmt(num(m.valores.salinidad))}</td>
                  <CeldaValor estado={estado(m, 'ph')}>{fmt(num(m.valores.ph), 2)}</CeldaValor>
                  <CeldaValor estado={estado(m, 'alcalinidad')}>{fmt(num(m.valores.alcalinidad))}</CeldaValor>
                  {quimicos.map((c) => (
                    <CeldaValor key={c.clave} estado={estado(m, c.clave)}>
                      {fmt(num(m.valores[c.clave]))}
                    </CeldaValor>
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
          <Seccion numero={numero('bact')} titulo="Análisis bacteriológico del agua" icono={Bug} nota="TCBS (Vibrios sp) · UFC/ml" />
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
                  <CeldaValor estado={estado(m, 'vibrios_amarillas')}>{cientifico(num(m.valores.vibrios_amarillas), 2)}</CeldaValor>
                  <CeldaValor estado={estado(m, 'vibrios_verdes')}>{cientifico(num(m.valores.vibrios_verdes), 2)}</CeldaValor>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Valores referenciales de las tablas que lleva el informe */}
      {hayReferencias && (
        <div className="rep-bloque">
          <div className="rep-subtitulo">Valores referenciales</div>
          {hayFuera && <LeyendaReferencia />}
          <div className="rep-referencias">
            {refBasicas && (
              <div className="rep-ref">
                <div className="rep-ref-titulo">Calidad del agua</div>
                <table>
                  <thead>
                    <tr>
                      <th>Parámetro</th>
                      <th>Fórmula</th>
                      <th>Valor referencial</th>
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
                      <td>100 – 140 mg/L</td>
                    </tr>
                    {conQuimico &&
                      conRango.map((c) => (
                        <tr key={c.clave}>
                          <td>{c.nombre ?? c.etiqueta}</td>
                          <td className="rep-negrita">{c.formula}</td>
                          <td>{textoRango(c)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            {conQuimico && conFactor.length > 0 && (
              <div className="rep-ref morado">
                <div className="rep-ref-titulo">Minerales</div>
                <table>
                  <thead>
                    <tr>
                      <th>Parámetro</th>
                      <th>Símbolo</th>
                      <th>Valor según salinidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conFactor.map((c) => (
                      <tr key={c.clave}>
                        <td>{c.nombre ?? c.etiqueta}</td>
                        <td className="rep-negrita">{(c.formula ?? '').replace(/[+⁺]+$/, '')}</td>
                        <td>{String(c.factorSalinidad).replace('.', ',')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rep-ref-nota">Multiplicar el valor por la salinidad para obtener el número referencial.</div>
              </div>
            )}
            {conBacteriologia && (
              <div className="rep-ref celeste">
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
            )}
          </div>
        </div>
      )}

      <Metodos
        lineas={[
          ...(conFito ? [['Fitoplancton', 'Conteo directo al microscopio en cámara de Neubauer'] as [string, string]] : []),
          ...(refBasicas ? [['Químico', 'Espectrofotometría (YSI 9300)'] as [string, string]] : []),
          ...(conBacteriologia ? [['Bacteriológico', 'Siembra directa del agua en medio sólido TCBS'] as [string, string]] : []),
        ]}
      />
      <Observaciones texto={informe.observaciones} />
      <Firma tecnico={informe.tecnico} />
      <Pie aviso="Los resultados corresponden únicamente a las muestras analizadas. Este informe no puede distribuirse, total ni parcialmente, sin autorización de Naturisa." />
    </>
  );
}
