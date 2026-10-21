import { evaluar, parametroDe, semestre, textoSemestre, fechaInforme } from '../../logic/monitoreo';
import type { DefinicionMonitoreo, Resultado, Sitio } from '../../types';
import './informe.css';

const LOGO = '/logo-naturisa-color.png';

const DEFINICIONES: [string, string][] = [
  ['Afluente', 'es el agua u otro líquido que ingresa a un cuerpo de agua receptor, reservorio, planta de tratamiento o proceso de tratamiento.'],
  ['Efluente', 'Descarga o vertido líquido proveniente de un proceso productivo o de una actividad determinada.'],
  ['Impacto ambiental', 'cambio o consecuencia en el ambiente que resulta de una acción específica o proyecto.'],
  ['Muestreo', 'proceso de tomar una porción representativa, de un volumen de agua u otro elemento, o una población, para el análisis de varias características definidas.'],
  ['Parámetro, componente o característica', 'es una variable o propiedad física, química, biológica, combinación de las anteriores, elemento o sustancia que sirve para caracterizar la calidad del recurso agua o de las descargas.'],
  ['Punto de muestreo', 'lugar donde se toman las muestras.'],
];

const NORMA = 'Acuerdo Ministerial 097a – Anexo 1. Recurso Agua';

/** "La empresa Naturisa S.A. – …" · "La Camaronera …" · "El Laboratorio de Larvas …" */
function sujeto(nombre: string) {
  if (/^laboratorio/i.test(nombre)) return `El ${nombre.charAt(0).toUpperCase()}${nombre.slice(1)}`;
  if (/^(camaronera|empacadora)/i.test(nombre)) return `La ${nombre}`;
  return `La empresa ${nombre}`;
}

interface InformeMonitoreoProps {
  sitio: Sitio;
  resultado: Resultado;
  definicion: DefinicionMonitoreo;
}

/**
 * Informe de Monitoreo del Análisis de Agua del Efluente (PGC-025), con el mismo texto del formato en Word.
 * Cambian solo los datos: camaronera (ficha técnica), fecha, resultados y código del informe del laboratorio.
 */
export function InformeMonitoreo({ sitio, resultado, definicion }: InformeMonitoreoProps) {
  const filas = resultado.valores
    .filter((v) => v.valor.trim())
    .map((v) => ({ ...v, parametro: parametroDe(definicion, v.clave), estado: evaluar(parametroDe(definicion, v.clave), v.valor) }));
  const excedidos = filas.filter((f) => f.estado === 'no-cumple');
  const laboratorio = resultado.laboratorio || 'externo';
  const anual = semestre(resultado.fechaMuestreo) === 1 ? 'primer' : 'segundo';
  let n = 0;
  const titulo = (texto: string) => <h2 className="pgc-h1">{`${++n}. ${texto}`}</h2>;

  return (
    <div className="pgc-hoja">
      <style>{'@media print { @page { size: A4 portrait; margin: 14mm 16mm; } }'}</style>
      <table className="pgc-pagina">
        {/* Se repite en cada hoja al imprimir */}
        <thead>
          <tr>
            <td>
              <table className="pgc-encabezado">
                <tbody>
                  <tr>
                    <td className="pgc-logo-celda">
                      <img src={LOGO} alt="Naturisa" />
                    </td>
                    <td className="pgc-titulo-celda">
                      INFORME DE MONITOREO DEL ANÁLISIS DE AGUA DEL EFLUENTE {sitio.nombre.toUpperCase()}
                    </td>
                    <td className="pgc-codigo-celda">
                      <b>PGC-025</b>
                      <br />
                      Revisión: 0
                      <br />
                      Fecha: {fechaInforme(resultado.fechaMuestreo)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              {titulo('Introducción')}
              <p>
                {sujeto(sitio.nombre)}, consciente de la importancia y el cuidado al medio ambiente y cumpliendo con la normativa ambiental
                vigente ha realizado su {anual} análisis anual de agua del efluente.
              </p>
              <p>
                En este informe se detalla los resultados obtenidos en los análisis efectuados por la empresa Laboratorio {laboratorio} y a
                su vez se realiza la comparación de los parámetros con la norma ambiental ({NORMA}), con la finalidad de demostrar que las
                actividades productivas de la compañía no afectan al medio ambiente.
              </p>

              {titulo('Ficha Técnica del Proyecto')}
              <table className="pgc-tabla">
                <tbody>
                  <FilaFicha etiqueta="Nombre de la entidad promotora del proyecto:" valor={sitio.entidad} />
                  <FilaFicha etiqueta="Nombre del Representante Legal:" valor={sitio.representante} />
                  <FilaFicha etiqueta="RUC:" valor={sitio.ruc} />
                  <FilaFicha etiqueta="Tipo de Proyecto:" valor={sitio.tipoProyecto} />
                  <FilaFicha etiqueta="Ubicación de la Oficina Administrativa:" valor={sitio.oficina} />
                  <tr>
                    <td className="pgc-etiqueta">Ubicación geográfica del Proyecto:</td>
                    <td>
                      {sitio.ubicacion}
                      {sitio.coordenadas.length > 0 && (
                        <table className="pgc-coordenadas">
                          <thead>
                            <tr>
                              <th>Puntos</th>
                              <th>Latitud N</th>
                              <th>Longitud E</th>
                            </tr>
                            {sitio.coordenadasTitulo && (
                              <tr>
                                <th colSpan={3}>{sitio.coordenadasTitulo}</th>
                              </tr>
                            )}
                          </thead>
                          <tbody>
                            {sitio.coordenadas.map((c, i) => (
                              <tr key={i}>
                                <td>{c.punto}</td>
                                <td>{c.norte}</td>
                                <td>{c.este}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                  <FilaFicha etiqueta="Superficie del proyecto:" valor={sitio.superficie} />
                </tbody>
              </table>

              {titulo('Objetivo')}
              <p>
                Elaborar el Informe de Monitoreo del análisis de agua del efluente correspondiente a {sitio.nombre}
                {sitio.lugar && ` ubicado en ${sitio.lugar}`} con la finalidad de verificar el cumplimiento de los parámetros ante la
                normativa ambiental vigente.
              </p>

              {titulo('Alcance')}
              <p>Aplica a los análisis de agua del efluente realizado para {sitio.nombre}.</p>

              {titulo('Términos y Definiciones')}
              {DEFINICIONES.map(([termino, texto]) => (
                <p key={termino}>
                  <b>{termino}:</b> {texto}
                </p>
              ))}

              {titulo('Resumen de los Resultados')}
              <p>
                Los análisis de agua del Efluente de {sitio.nombre} fueron realizados por Laboratorio {laboratorio}. Los cuales muestran
                los siguientes resultados:
              </p>
              {(resultado.norte || resultado.este) && (
                <p>
                  <b>Coordenadas de Muestreo Efluente:</b> Norte: {resultado.norte}; Este: {resultado.este}
                </p>
              )}
              <div className="pgc-epigrafe">
                Tabla 1. Resultados Análisis Efluentes - {sitio.nombre}
                <br />
                {textoSemestre(resultado.fechaMuestreo)}
              </div>
              <table className="pgc-tabla pgc-entera">
                <thead>
                  <tr>
                    <th>Parámetros</th>
                    <th>Unidades</th>
                    <th>Resultados de Efluentes *</th>
                    <th>Límite máximo permisible**</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.clave}>
                      <td>{f.parametro?.nombre ?? f.clave}</td>
                      <td className="pgc-centro">{f.parametro?.unidad}</td>
                      <td className={`pgc-centro ${f.estado === 'no-cumple' ? 'pgc-excede' : ''}`}>
                        {f.valor}
                        {f.estado === 'no-cumple' && ' (supera)'}
                      </td>
                      <td className="pgc-centro">{f.parametro?.limite}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="pgc-nota">
                <p>* Resultados de los análisis de agua de efluentes realizados por Laboratorio {laboratorio}.</p>
                <p>
                  ** Límites máximos permisibles según la Tabla 10 - Límites de descarga a un cuerpo de agua marina, Acuerdo Ministerial
                  097, Anexo 1. Recurso Agua.
                </p>
              </div>
              <p style={{ marginTop: 10 }}>
                De acuerdo con los resultados obtenidos de los análisis efectuados por el Laboratorio {laboratorio}, correspondiente a{' '}
                {sitio.nombre} y comparados con la normativa ambiental vigente ({NORMA}),{' '}
                {excedidos.length
                  ? `se observa que ${excedidos.length === 1 ? 'el parámetro' : 'los parámetros'} ${excedidos
                      .map((f) => f.parametro?.nombre ?? f.clave)
                      .join(', ')} ${excedidos.length === 1 ? 'supera' : 'superan'} el límite máximo permisible.`
                  : 'se observa que no existe un impacto ambiental al agua marina.'}
              </p>

              {titulo('Anexos')}
              <p>
                {resultado.codigo} Informe de Resultados Análisis de Agua Natural (Efluente
                {resultado.locacion && ` – ${resultado.locacion}`}).
              </p>

              <div className="pgc-pie">Naturisa S.A.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function FilaFicha({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <tr>
      <td className="pgc-etiqueta">{etiqueta}</td>
      <td>{valor}</td>
    </tr>
  );
}
