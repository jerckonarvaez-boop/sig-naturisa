import { Bug, Microscope } from 'lucide-react';
import { cientifico, claseGrado, fechaLegible, grado, num, txt, type InformeVista } from '../../logic/reporte';
import type { CampoLab } from '../../types';
import { Encabezado, Ficha, Firma, Metodos, Observaciones, Pie, Seccion } from './comunes';

/** Nombres de las condiciones tal como aparecen en el informe */
const NOMBRE_OFICIAL: Record<string, string> = {
  deformidad_tubulos: 'Deformidad en túbulos del hepatopáncreas',
  lipidos: 'Lípidos en hepatopáncreas',
  baculovirus: 'Hepatopáncreas: baculovirus',
  vermiformes_hp: 'Cuerpos vermiformes en hepatopáncreas',
  epibiontes: 'Epibiontes en branquias y apéndices',
  necrosis_branquial: 'Necrosis branquial',
  gregarinas: 'Tracto digestivo: gregarinas',
  nematodos: 'Tracto digestivo: nematodos',
  vermiformes_intestino: 'Cuerpos vermiformes en intestino',
  diatomeas_td: 'Tracto digestivo: diatomeas',
  cianofitas_td: 'Tracto digestivo: cianofitas',
};

const BACTERIOLOGIA: [string, string, string, string][] = [
  // órgano, clave amarillas, clave verdes, unidad
  ['Hepatopáncreas', 'hp_amarillas', 'hp_verdes', 'UFC/g'],
  ['Estómago', 'est_amarillas', 'est_verdes', 'UFC/g'],
  ['Hemolinfa', 'hem_amarillas', 'hem_verdes', 'UFC/ml'],
];

interface ReportePatologiaProps {
  informe: InformeVista;
  /** Las 11 condiciones con grado (en el orden de la definición) */
  condiciones: CampoLab[];
  conFresco: boolean;
  conBacteriologia: boolean;
}

/** Informe de Patologías en fresco (AF): bacteriología y/o análisis en fresco; formato de una o de varias muestras */
export function ReportePatologia({ informe, condiciones, conFresco, conBacteriologia }: ReportePatologiaProps) {
  const muestras = informe.muestras;
  const una = muestras.length === 1;
  const columnas = muestras.length + 1;
  const notas = muestras.map((m) => txt(m.valores.notas)).filter(Boolean);
  // Los órganos que se analizaron (la hemolinfa, solo si tiene valores)
  const organos = BACTERIOLOGIA.filter(([organo, a, v]) => organo !== 'Hemolinfa' || muestras.some((m) => num(m.valores[a]) != null || num(m.valores[v]) != null));

  return (
    <>
      <Encabezado informe={informe} />
      <Ficha
        datos={[
          ['Identificación de la muestra', informe.sucursal],
          ['Matriz', informe.matriz],
          ['Fecha de recepción', fechaLegible(informe.fechaMuestra)],
          ['Fecha de emisión', fechaLegible(informe.fechaEmision)],
          ['Muestreado por', informe.muestreadoPor],
        ]}
      />

      {conBacteriologia && (
        <>
          <Seccion numero={1} titulo="Bacteriología" icono={Bug} nota="TCBS (Vibrios sp)" />
          <table className="rep-tabla">
            <thead>
              <tr>
                <th>Colonias</th>
                {muestras.map((m, i) => (
                  <th key={i}>{m.nombre}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {organos.map(([organo, amarillas, verdes, unidad]) => [
                <tr key={organo}>
                  <td colSpan={columnas} className="rep-barra">
                    {organo} <span style={{ fontWeight: 400 }}>· {unidad}</span>
                  </td>
                </tr>,
                ...[
                  [amarillas, 'Amarillas'],
                  [verdes, 'Verdes'],
                ].map(([clave, nombre]) => (
                  <tr key={clave}>
                    <td>{nombre}</td>
                    {muestras.map((m, i) => (
                      <td key={i} className="rep-negrita">
                        {cientifico(num(m.valores[clave]))}
                      </td>
                    ))}
                  </tr>
                )),
              ])}
            </tbody>
          </table>
        </>
      )}

      {conFresco && (
        <>
          <Seccion numero={conBacteriologia ? 2 : 1} titulo="Análisis en fresco" icono={Microscope} nota="Grado de 0 a 4" />
          <table className="rep-tabla">
            <thead>
              <tr>
                <th>Condición / patología</th>
                {muestras.map((m, i) => (
                  <th key={i} style={{ minWidth: 60 }}>
                    {m.nombre}
                  </th>
                ))}
                {una && <th>Observaciones</th>}
              </tr>
            </thead>
            <tbody>
              {condiciones.map((c, fila) => (
                <tr key={c.clave}>
                  <td className="rep-condicion">{NOMBRE_OFICIAL[c.clave] ?? c.etiqueta}</td>
                  {muestras.map((m, i) => {
                    const v = num(m.valores[c.clave]);
                    return (
                      <td key={i} className={claseGrado(v)} style={{ fontSize: 12 }}>
                        {grado(v)}
                      </td>
                    );
                  })}
                  {una && fila === 0 && (
                    <td rowSpan={condiciones.length} className="rep-pequeno" style={{ verticalAlign: 'top', maxWidth: 220, textAlign: 'left' }}>
                      {notas[0]}
                    </td>
                  )}
                </tr>
              ))}
              <tr>
                <td className="rep-condicion rep-negrita">Otros</td>
                {muestras.map((m, i) => (
                  <td key={i} className="rep-pequeno">
                    {txt(m.valores.otros)}
                  </td>
                ))}
                {una && <td />}
              </tr>
              <tr>
                <td className="rep-condicion rep-negrita">Apariencia externa</td>
                {muestras.map((m, i) => (
                  <td key={i} className="rep-muy-pequeno">
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
                  <td className="rep-condicion rep-negrita">Observaciones</td>
                  {muestras.map((m, i) => (
                    <td key={i} className="rep-muy-pequeno">
                      {txt(m.valores.notas)}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
          <div className="rep-leyenda">
            Grado: 0 = ausencia · 0,1 – 0,9 = bajo · <span className="rep-grado-medio">1,0 – 1,9 = medio</span> ·{' '}
            <span className="rep-grado-alto" style={{ padding: '0 4px', borderRadius: 3 }}>
              2,0 – 2,9 = alto
            </span>{' '}
            ·{' '}
            <span className="rep-grado-muy-alto" style={{ padding: '0 4px', borderRadius: 3 }}>
              3,0 – 4,0 = muy alto
            </span>
          </div>
        </>
      )}
      {conBacteriologia && <div className="rep-nota-tabla">inc. = Incontables colonias.</div>}

      <Metodos
        lineas={[
          ...(conFresco ? [['Patología en fresco', 'Observación directa al microscopio de montajes en fresco de muestras de camarón'] as [string, string]] : []),
          ...(conBacteriologia ? [['Bacteriología', 'Siembra en medio sólido TCBS y dilución de macerado de hepatopáncreas y estómago'] as [string, string]] : []),
        ]}
      />
      <Observaciones texto={informe.observaciones} />
      <Firma tecnico={informe.tecnico} empresa="Naturisa S.A." />
      <Pie aviso="Los resultados corresponden únicamente a las muestras analizadas. Este informe no puede distribuirse, total ni parcialmente, sin autorización escrita de Naturisa." />
    </>
  );
}
