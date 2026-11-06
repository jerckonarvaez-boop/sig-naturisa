import { useMemo, type ReactNode } from 'react';
import { DEFINICIONES, datosDelInforme, logosDelInforme } from '../../logic/informe';
import { fechaInforme, textoSemestre } from '../../logic/monitoreo';
import type { DefinicionMonitoreo, EdicionInforme, Resultado, Sitio } from '../../types';
import { DocumentoPaginado, type DefinicionTabla, type Elemento } from './DocumentoPaginado';
import './informe.css';

// Columnas en px (anchos de las tablas del Word)
const TABLAS: Record<string, DefinicionTabla> = {
  ficha: { className: 'pgc-ficha', columnas: [167, 77, 132, 146], conEtiqueta: true },
  resultados: { className: 'pgc-resultados', columnas: [137, 65, 105, 96] },
};

interface InformeMonitoreoProps {
  sitio: Sitio;
  resultado: Resultado;
  definicion: DefinicionMonitoreo;
  /** Textos que se están corrigiendo (aún sin guardar) */
  edicion?: EdicionInforme;
}

/**
 * Informe de Monitoreo del Análisis de Agua del Efluente (PGC-025) con el formato del Word: hojas A4 con encabezado de
 * doble borde (logo de la camaronera, título, código, revisión, página y fecha), pie "Naturisa S.A.", ficha técnica y
 * tabla de resultados. Cambian solo los datos de la camaronera, la fecha, los resultados y el código del laboratorio.
 */
export function InformeMonitoreo({ sitio, resultado, definicion, edicion }: InformeMonitoreoProps) {
  const { filas, textos: tx, titulo, laboratorio, larvas } = datosDelInforme(sitio, resultado, definicion, edicion);

  const elementos = useMemo<Elemento[]>(() => {
    const e: Elemento[] = [];
    const bloque = (clave: string, nodo: ReactNode, conSiguiente = false) => e.push({ tipo: 'bloque', clave, nodo, conSiguiente });
    let n = 0;
    const titulo = (texto: string) => bloque(`h-${texto}`, <p className="pgc-h">{`${++n}. ${texto}`}</p>, true);
    const fichaFila = (clave: string, etiqueta: ReactNode, valor: ReactNode, className = 'pgc-arriba pgc-abajo') =>
      e.push({ tipo: 'fila', tabla: 'ficha', clave, etiqueta, className, nodo: <td className="pgc-valor" colSpan={3}>{valor}</td> });

    titulo('Introducción');
    bloque('intro-1', <p className="pgc-p">{tx.intro1}</p>);
    bloque('intro-2', <p className="pgc-p">{tx.intro2}</p>);
    bloque('v1', <div className="pgc-vacio" />);

    // Ficha técnica: una sola tabla; "Ubicación geográfica" va combinada a lo alto de las coordenadas
    titulo('Ficha Técnica del Proyecto');
    fichaFila('entidad', 'Nombre de la entidad promotora del proyecto:', sitio.entidad);
    fichaFila('representante', 'Nombre del Representante Legal:', sitio.representante, 'pgc-arriba');
    fichaFila('ruc', 'RUC:', sitio.ruc, '');
    fichaFila('tipo', 'Tipo de Proyecto:', sitio.tipoProyecto, 'pgc-abajo');
    fichaFila('oficina', 'Ubicación de la Oficina Administrativa:', sitio.oficina);
    // La etiqueta va solo en la primera fila: si el grupo sigue en otra hoja, allí la celda queda vacía (como en Word)
    const ubicacion = { tipo: 'fila' as const, tabla: 'ficha', grupo: 'ubicacion' };
    e.push({
      ...ubicacion,
      clave: 'ubic',
      etiqueta: 'Ubicación geográfica del Proyecto:',
      className: 'pgc-arriba',
      nodo: <td className="pgc-valor" colSpan={3}>{sitio.ubicacion}</td>,
    });
    if (sitio.coordenadas.length) {
      e.push({
        ...ubicacion,
        clave: 'coord-cab',
        nodo: ['Puntos', 'Latitud N', 'Longitud E'].map((c) => (
          <td key={c} className="pgc-coordenada pgc-gris">
            {c}
          </td>
        )),
      });
      if (sitio.coordenadasTitulo) {
        e.push({ ...ubicacion, clave: 'coord-tit', nodo: <td className="pgc-coordenada pgc-gris" colSpan={3}>{sitio.coordenadasTitulo}</td> });
      }
      sitio.coordenadas.forEach((c, i) =>
        e.push({
          ...ubicacion,
          clave: `coord-${i}`,
          className: i === sitio.coordenadas.length - 1 ? 'pgc-abajo' : '',
          nodo: (
            <>
              <td className="pgc-coordenada">{c.punto}</td>
              <td className="pgc-coordenada">{c.norte}</td>
              <td className="pgc-coordenada">{c.este}</td>
            </>
          ),
        }),
      );
    }
    fichaFila('superficie', 'Superficie del proyecto:', sitio.superficie);
    bloque('v2', <div className="pgc-vacio" />);

    titulo('Objetivo');
    bloque('objetivo', <p className="pgc-p">{tx.objetivo}</p>);
    bloque('v3', <div className="pgc-vacio-sin" />);
    titulo('Alcance');
    bloque('alcance', <p className="pgc-p">{tx.alcance}</p>);

    titulo('Términos y Definiciones');
    DEFINICIONES.forEach(([termino, texto]) =>
      bloque(
        `def-${termino}`,
        <p className="pgc-p-def">
          <b>{termino}</b> {texto}
        </p>,
      ),
    );
    bloque('v4', <div className="pgc-vacio-sin" />);

    titulo('Resumen de los Resultados');
    bloque('resumen', <p className="pgc-p">{tx.resumen}</p>);
    bloque('v5', <div className="pgc-vacio" />);
    if (resultado.norte || resultado.este) {
      bloque(
        'coordenadas',
        <p className="pgc-coord">
          <b>1.&nbsp;&nbsp;&nbsp;Coordenadas de Muestreo Efluente: Norte:</b> {resultado.norte}; <b>Este:</b> {resultado.este}
        </p>,
        true,
      );
      bloque('v6', <div className="pgc-vacio-chico" />, true);
    }
    bloque(
      'epigrafe',
      <p className="pgc-epigrafe">
        Tabla 1. {tx.tabla}
        <br />
        {textoSemestre(resultado.fechaMuestreo)}
      </p>,
      true,
    );
    bloque('v7', <div className="pgc-vacio-chico" />, true);
    e.push({
      tipo: 'fila',
      tabla: 'resultados',
      clave: 'res-cab',
      conSiguiente: true,
      nodo: ['Parámetros', 'Unidades', 'Resultados de Efluentes *', 'Límite máximo permisible**'].map((c) => (
        <td key={c} className="pgc-gris">
          {c}
        </td>
      )),
    });
    filas.forEach((f) =>
      e.push({
        tipo: 'fila',
        tabla: 'resultados',
        clave: `res-${f.clave}`,
        nodo: (
          <>
            <td className={larvas ? '' : 'pgc-izq'}>{f.nombre}</td>
            <td>{f.unidad}</td>
            <td className={f.estado === 'no-cumple' ? 'pgc-excede' : ''}>
              {f.valor}
              {f.estado === 'no-cumple' && ' ▲'}
            </td>
            <td>{f.limite}</td>
          </>
        ),
      }),
    );
    bloque('v8', <div className="pgc-vacio-sin" />);
    bloque(
      'notas',
      <div className="pgc-nota">
        <span className="pgc-ast">*</span> Resultados de los análisis de agua de efluentes realizados por Laboratorio {laboratorio}
        <br />
        ** Límites máximos permisibles según la{' '}
        <i>Tabla 10 - Límites de descarga a un cuerpo de agua marina, Acuerdo Ministerial 097, Anexo 1. Recurso Agua.</i>
      </div>,
    );
    bloque('v9', <div className="pgc-vacio-sin" />);
    bloque('conclusion', <p className="pgc-sin">{tx.conclusion}</p>);
    bloque('v10', <div className="pgc-vacio-sin" />);

    titulo('Anexos');
    bloque(
      'anexo',
      <p className="pgc-anexo">{tx.anexo}</p>,
    );
    return e;
    // El contenido depende solo de estos datos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify([sitio, resultado, filas, tx, laboratorio])]);

  const fecha = fechaInforme(resultado.fechaMuestreo);

  /** Encabezado de doble borde: el de la primera hoja lleva Revisión y Fecha */
  const encabezado = (pagina: number, total: number) => {
    const primera = pagina === 1;
    const anchos = primera ? [131, 384, 130] : [121, 375, 119];
    const logos = logosDelInforme(sitio);
    return (
      <table className="pgc-enc" style={{ width: anchos.reduce((a, b) => a + b, 0), height: primera ? 127 : 84 }}>
        <colgroup>
          {anchos.map((w, i) => (
            <col key={i} style={{ width: w }} />
          ))}
        </colgroup>
        <tbody>
          <tr>
            <td className="pgc-enc-logo">
              {logos.map((src) => (
                <img key={src} src={src} alt="" style={{ maxHeight: logos.length > 1 ? 34 : primera ? 70 : 50 }} />
              ))}
              {!logos.length && <span className="pgc-enc-logo-texto">{sitio.logoTexto}</span>}
            </td>
            <td className="pgc-enc-titulo">
              INFORME DE MONITOREO DEL ANÁLISIS DE AGUA DEL EFLUENTE
              <br />
              {titulo}
            </td>
            <td className="pgc-enc-datos">
              {primera ? (
                <>
                  <div style={{ height: 25 }}>
                    <b>PGC-025</b>
                  </div>
                  <div style={{ height: 25 }}>
                    <b>Revisión:</b>&nbsp;0
                  </div>
                  <div style={{ height: 25 }}>
                    <b>Pág.</b>&nbsp;{pagina}/{total}
                  </div>
                  <div style={{ height: 46, flexDirection: 'column' }}>
                    <b>Fecha:</b>
                    {fecha}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ height: 37 }}>
                    <b>PGC-025</b>
                  </div>
                  <div style={{ height: 41 }}>
                    <b>Pág.</b>&nbsp;{pagina}/{total}
                  </div>
                </>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <DocumentoPaginado
      elementos={elementos}
      tablas={TABLAS}
      encabezado={encabezado}
      pie="Naturisa S.A."
      version={JSON.stringify([sitio, resultado.actualizadoEn, resultado.id, filas, tx, laboratorio])}
    />
  );
}
