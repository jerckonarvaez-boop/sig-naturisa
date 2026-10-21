import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Documento dividido en hojas A4 como en Word: cada hoja tiene su encabezado (con "Pág. X/Y"), el cuerpo y el pie.
 * El contenido es una lista de elementos: bloques (párrafos, títulos) y filas de tabla. Primero se miden todos en un
 * contenedor oculto con el mismo ancho del cuerpo y luego se reparten en hojas; una tabla larga continúa en la hoja
 * siguiente (como la ficha técnica con muchas coordenadas).
 */

/** Párrafo, título o cualquier bloque que no se parte entre hojas */
export interface Bloque {
  tipo: 'bloque';
  clave: string;
  nodo: ReactNode;
  /** No se queda solo al final de la hoja: pasa a la siguiente junto con el elemento que lo sigue */
  conSiguiente?: boolean;
}

/** Fila de una tabla (sus <td>). Las filas seguidas de la misma tabla se dibujan juntas en cada hoja. */
export interface Fila {
  tipo: 'fila';
  clave: string;
  tabla: string;
  nodo: ReactNode;
  className?: string;
  /** Filas con el mismo grupo comparten la celda de etiqueta de la primera columna (combinada a lo alto) */
  grupo?: string;
  /** Texto de la celda combinada (solo en la primera fila del grupo) */
  etiqueta?: ReactNode;
  conSiguiente?: boolean;
}

export type Elemento = Bloque | Fila;

export interface DefinicionTabla {
  className: string;
  /** Ancho de cada columna en px */
  columnas: number[];
  /** La primera columna es la etiqueta combinada de cada grupo (la pone el documento) */
  conEtiqueta?: boolean;
}

interface DocumentoPaginadoProps {
  elementos: Elemento[];
  tablas: Record<string, DefinicionTabla>;
  /** Encabezado de la hoja (la primera suele ser distinta) */
  encabezado: (pagina: number, total: number) => ReactNode;
  pie: ReactNode;
  /** Cambia cuando cambia el contenido: vuelve a medir y repartir */
  version: string;
}

// Medidas de la hoja A4 a 96 ppp (iguales al Word: márgenes de 2,54 cm)
const CUERPO_ARRIBA = { primera: 184, siguientes: 162 };
const CUERPO_ABAJO = 1027;

const capacidad = (pagina: number) => CUERPO_ABAJO - (pagina === 0 ? CUERPO_ARRIBA.primera : CUERPO_ARRIBA.siguientes);

/** Reparte los elementos en hojas según su alto */
function repartir(elementos: Elemento[], altos: number[]): number[][] {
  const paginas: number[][] = [[]];
  let usado = 0;
  for (let i = 0; i < elementos.length; i++) {
    // Un elemento "con el siguiente" necesita caber junto con lo que le sigue
    let necesario = altos[i];
    for (let j = i; elementos[j]?.conSiguiente && j + 1 < elementos.length; j++) necesario += altos[j + 1];
    const actual = paginas[paginas.length - 1];
    if (actual.length && usado + Math.min(necesario, capacidad(paginas.length - 1)) > capacidad(paginas.length - 1)) {
      paginas.push([]);
      usado = 0;
    }
    paginas[paginas.length - 1].push(i);
    usado += altos[i];
  }
  return paginas;
}

/** Dibuja los elementos de una hoja: agrupa las filas seguidas de cada tabla en un <table> */
function Cuerpo({ elementos, tablas, conEtiquetas }: { elementos: Elemento[]; tablas: Record<string, DefinicionTabla>; conEtiquetas: boolean }) {
  const partes: ReactNode[] = [];
  for (let i = 0; i < elementos.length; ) {
    const e = elementos[i];
    if (e.tipo === 'bloque') {
      partes.push(<Fragment key={e.clave}>{e.nodo}</Fragment>);
      i++;
      continue;
    }
    const def = tablas[e.tabla];
    const filas: Fila[] = [];
    while (i < elementos.length && elementos[i].tipo === 'fila' && (elementos[i] as Fila).tabla === e.tabla) filas.push(elementos[i++] as Fila);
    partes.push(
      <table key={`t-${filas[0].clave}`} className={def.className} style={{ width: def.columnas.reduce((a, b) => a + b, 0) }}>
        <colgroup>
          {def.columnas.map((w, k) => (
            <col key={k} style={{ width: w }} />
          ))}
        </colgroup>
        <tbody>
          {filas.map((f, k) => {
            // Celda de etiqueta combinada a lo alto: una por grupo en cada hoja
            let etiqueta: ReactNode = null;
            if (def.conEtiqueta && (k === 0 || filas[k - 1].grupo !== f.grupo || !f.grupo)) {
              let alto = 1;
              while (f.grupo && filas[k + alto]?.grupo === f.grupo) alto++;
              // Al medir, la etiqueta combinada no se dibuja (repartiría su alto en una sola fila)
              etiqueta = (
                <td className="pgc-etiqueta" rowSpan={conEtiquetas ? alto : 1}>
                  {conEtiquetas || !f.grupo ? f.etiqueta : null}
                </td>
              );
            } else if (def.conEtiqueta && !conEtiquetas) {
              etiqueta = <td className="pgc-etiqueta" />;
            }
            return (
              <tr key={f.clave} className={f.className}>
                {etiqueta}
                {f.nodo}
              </tr>
            );
          })}
        </tbody>
      </table>,
    );
  }
  return <>{partes}</>;
}

export function DocumentoPaginado({ elementos, tablas, encabezado, pie, version }: DocumentoPaginadoProps) {
  const medida = useRef<HTMLDivElement>(null);
  const [paginas, setPaginas] = useState<number[][] | null>(null);

  useLayoutEffect(() => {
    let vigente = true;
    const medir = () => {
      const nodos = medida.current?.querySelectorAll<HTMLElement>('[data-elemento]');
      if (!nodos || !vigente) return;
      // Alto de cada elemento: distancia hasta el siguiente (incluye los espacios entre párrafos)
      const tops = [...nodos].map((n) => n.getBoundingClientRect().top);
      const fin = medida.current!.getBoundingClientRect().bottom;
      const altos = tops.map((t, i) => (i + 1 < tops.length ? tops[i + 1] : fin) - t);
      setPaginas(repartir(elementos, altos));
    };
    medir();
    // Las fuentes pueden terminar de cargar después: se vuelve a medir
    document.fonts?.ready.then(medir);
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  return (
    <>
      {/* Medición: cada elemento por separado, con el mismo ancho del cuerpo de la hoja */}
      <div ref={medida} className="pgc-medida pgc-cuerpo-texto" aria-hidden="true">
        {elementos.map((e) =>
          e.tipo === 'bloque' ? (
            <div key={e.clave} data-elemento>
              {e.nodo}
            </div>
          ) : (
            <div key={e.clave} data-elemento>
              <Cuerpo elementos={[e]} tablas={tablas} conEtiquetas={false} />
            </div>
          ),
        )}
      </div>

      {paginas?.map((indices, p) => (
        <div key={p} className="pgc-a4">
          <div className="pgc-a4-encabezado">{encabezado(p + 1, paginas.length)}</div>
          <div className="pgc-a4-cuerpo pgc-cuerpo-texto" style={{ top: p === 0 ? CUERPO_ARRIBA.primera : CUERPO_ARRIBA.siguientes }}>
            <Cuerpo elementos={indices.map((i) => elementos[i])} tablas={tablas} conEtiquetas />
          </div>
          <div className="pgc-a4-pie">{pie}</div>
        </div>
      ))}
    </>
  );
}
