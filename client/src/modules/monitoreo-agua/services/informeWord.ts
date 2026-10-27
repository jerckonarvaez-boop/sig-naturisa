// Informe PGC-025 en Word (.docx) con el mismo formato de la vista: hoja A4, encabezado de doble borde (distinto en la
// primera hoja), "Pág. X/Y" que Word calcula solo, pie "Naturisa S.A.", ficha técnica y tabla de resultados.
// La librería se carga solo al usarlo, para no hacer más pesada la carga inicial de la app.
import type { IBorderOptions, IParagraphOptions, ITableCellOptions, Paragraph as ParrafoDocx, ParagraphChild, Table as TablaDocx, TableCell as CeldaDocx } from 'docx';
import { DEFINICIONES, datosDelInforme, logosDelInforme } from '../logic/informe';
import { fechaInforme, textoSemestre } from '../logic/monitoreo';
import type { DefinicionMonitoreo, EdicionInforme, Resultado, Sitio } from '../types';

/** Medidas en twips (1 px a 96 ppp = 15 twips; 1 cm = 567) */
const px = (n: number) => Math.round(n * 15);
const FUENTE = 'Arial';
const GRIS = 'EDEDED';

interface Logo {
  datos: Uint8Array;
  ancho: number;
  alto: number;
}

/** Logos ya descargados (al bajar varios informes juntos se repiten) */
const logosCargados = new Map<string, Promise<Logo | null>>();
const cargarLogo = (url: string) => {
  if (!logosCargados.has(url)) logosCargados.set(url, descargarLogo(url));
  return logosCargados.get(url)!;
};

/** Descarga un logo y lo pasa a PNG (así Word lo abre aunque sea SVG o WebP) */
async function descargarLogo(url: string): Promise<Logo | null> {
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const imagen = await createImageBitmap(await res.blob());
    const lienzo = document.createElement('canvas');
    lienzo.width = imagen.width;
    lienzo.height = imagen.height;
    lienzo.getContext('2d')!.drawImage(imagen, 0, 0);
    const png = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/png'));
    return png ? { datos: new Uint8Array(await png.arrayBuffer()), ancho: imagen.width, alto: imagen.height } : null;
  } catch {
    return null;
  }
}

/** Genera el informe PGC-025 de una camaronera como archivo Word (edicion: textos corregidos aún sin guardar) */
export async function informeAWord(sitio: Sitio, resultado: Resultado, definicion: DefinicionMonitoreo, edicion?: EdicionInforme): Promise<Blob> {
  const d = await import('docx');
  const { AlignmentType, BorderStyle, HeightRule, PageNumber, ShadingType, TabStopType, VerticalAlign, VerticalMergeType, WidthType } = d;
  const { filas, textos: tx, titulo: tituloEncabezado, laboratorio, larvas } = datosDelInforme(sitio, resultado, definicion, edicion);
  const logos = (await Promise.all(logosDelInforme(sitio).map(cargarLogo))).filter((l): l is Logo => l !== null);

  const LINEA: IBorderOptions = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
  const NADA: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const DOBLE: IBorderOptions = { style: BorderStyle.DOUBLE, size: 6, color: '000000' };
  const interlineado = { line: 276 }; // 1,15

  /** Texto en Arial: tamaño en puntos */
  const t = (text: string, pt: number, o: { bold?: boolean; italics?: boolean; color?: string } = {}) =>
    new d.TextRun({ text, font: FUENTE, size: pt * 2, ...o });

  const parrafo = (hijos: ParagraphChild[], o: Omit<IParagraphOptions, 'children'> = {}) =>
    new d.Paragraph({ children: hijos, spacing: { ...interlineado }, ...o });

  /* ---------- cuerpo ---------- */
  const cuerpo: (ParrafoDocx | TablaDocx)[] = [];
  const normal = (texto: string) =>
    cuerpo.push(parrafo([t(texto, 12)], { alignment: AlignmentType.JUSTIFIED, spacing: { ...interlineado, before: 120, after: 120 } }));
  /** Línea vacía: "con" lleva 6 pt antes y después; "sin" no; "chica" es de 8 pt */
  const vacio = (tipo: 'con' | 'sin' | 'chica' = 'con') =>
    cuerpo.push(
      parrafo([t('', tipo === 'chica' ? 8 : 12)], {
        spacing: tipo === 'con' ? { ...interlineado, before: 120, after: 120 } : { ...interlineado },
        keepNext: tipo === 'chica',
      }),
    );
  let n = 0;
  const titulo = (texto: string) =>
    cuerpo.push(parrafo([t(`${++n}. ${texto}`, 12, { bold: true })], { keepNext: true, spacing: { ...interlineado, before: 120, after: 120 } }));

  titulo('Introducción');
  normal(tx.intro1);
  normal(tx.intro2);
  vacio();

  titulo('Ficha Técnica del Proyecto');
  cuerpo.push(fichaTecnica());
  vacio();

  titulo('Objetivo');
  normal(tx.objetivo);
  vacio('sin');
  titulo('Alcance');
  normal(tx.alcance);

  titulo('Términos y Definiciones');
  DEFINICIONES.forEach(([termino, texto]) =>
    cuerpo.push(parrafo([t(termino, 12, { bold: true }), t(` ${texto}`, 12)], { alignment: AlignmentType.JUSTIFIED, spacing: { ...interlineado, after: 120 } })),
  );
  vacio('sin');

  titulo('Resumen de los Resultados');
  normal(tx.resumen);
  vacio();
  if (resultado.norte || resultado.este) {
    cuerpo.push(
      parrafo(
        [
          t('1.   Coordenadas de Muestreo Efluente: Norte:', 9, { bold: true, italics: true }),
          t(` ${resultado.norte}; `, 9, { italics: true }),
          t('Este:', 9, { bold: true, italics: true }),
          t(` ${resultado.este}`, 9, { italics: true }),
        ],
        { indent: { left: px(26) }, keepNext: true },
      ),
    );
    vacio('chica');
  }
  cuerpo.push(
    parrafo([t(`Tabla 1. ${tx.tabla}`, 8, { bold: true, italics: true }), new d.TextRun({ break: 1 }), t(textoSemestre(resultado.fechaMuestreo), 8, { bold: true, italics: true })], {
      alignment: AlignmentType.CENTER,
      keepNext: true,
    }),
  );
  vacio('chica');
  cuerpo.push(tablaResultados());
  vacio('sin');
  cuerpo.push(
    parrafo([t('*', 9), t(` Resultados de los análisis de agua de efluentes realizados por Laboratorio ${laboratorio}`, 8)]),
    parrafo([
      t('** Límites máximos permisibles según la ', 8),
      t('Tabla 10 - Límites de descarga a un cuerpo de agua marina, Acuerdo Ministerial 097, Anexo 1. Recurso Agua.', 8, { italics: true }),
    ]),
  );
  vacio('sin');
  cuerpo.push(parrafo([t(tx.conclusion, 12)], { alignment: AlignmentType.JUSTIFIED }));
  vacio('sin');

  titulo('Anexos');
  cuerpo.push(
    parrafo([t('•', 10), new d.TextRun({ text: '\t' }), t(tx.anexo, 10)], {
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: px(48), hanging: px(24) },
      tabStops: [{ type: TabStopType.LEFT, position: px(48) }],
      spacing: { ...interlineado, before: 120 },
    }),
  );

  /* ---------- ficha técnica (9 pt) ---------- */
  function fichaTecnica() {
    const ANCHOS = [167, 77, 132, 146];
    const margenes = { top: px(1), bottom: px(1), left: px(5), right: px(5) };
    const filasFicha: InstanceType<typeof d.TableRow>[] = [];
    const celda = (hijos: ParrafoDocx[], o: Omit<ITableCellOptions, 'children'> = {}): CeldaDocx =>
      new d.TableCell({ children: hijos, margins: margenes, verticalAlign: VerticalAlign.CENTER, ...o });
    const etiqueta = (texto: string) => parrafo([t(texto, 9, { bold: true })], { alignment: AlignmentType.RIGHT });
    const valor = (texto: string) => parrafo([t(texto, 9)], { alignment: AlignmentType.JUSTIFIED });
    const coordenada = (texto: string, gris = false, columnSpan = 1) =>
      celda([parrafo([t(texto, 9, { bold: gris })], { alignment: AlignmentType.CENTER, spacing: { line: 252 } })], {
        columnSpan,
        borders: { top: LINEA, bottom: LINEA, left: LINEA, right: LINEA },
        margins: { ...margenes, top: 0, bottom: 0 },
        shading: gris ? { type: ShadingType.CLEAR, fill: GRIS, color: 'auto' } : undefined,
      });

    /** Fila "Etiqueta: valor"; arriba/abajo dicen si lleva línea de separación */
    const fila = (texto: string, dato: string, arriba = true, abajo = true) =>
      filasFicha.push(
        new d.TableRow({
          cantSplit: true,
          children: [
            celda([etiqueta(texto)], { borders: { top: arriba ? LINEA : NADA, bottom: abajo ? LINEA : NADA, left: LINEA, right: LINEA } }),
            celda([valor(dato)], { columnSpan: 3, borders: { top: arriba ? LINEA : NADA, bottom: abajo ? LINEA : NADA, left: LINEA, right: LINEA } }),
          ],
        }),
      );

    fila('Nombre de la entidad promotora del proyecto:', sitio.entidad);
    fila('Nombre del Representante Legal:', sitio.representante, true, false);
    fila('RUC:', sitio.ruc, false, false);
    fila('Tipo de Proyecto:', sitio.tipoProyecto, false, true);
    fila('Ubicación de la Oficina Administrativa:', sitio.oficina);

    // "Ubicación geográfica" combinada a lo alto de la descripción y las coordenadas
    const filasUbicacion: CeldaDocx[][] = [[celda([valor(sitio.ubicacion)], { columnSpan: 3, borders: { top: LINEA, bottom: sitio.coordenadas.length ? NADA : LINEA, left: LINEA, right: LINEA } })]];
    if (sitio.coordenadas.length) {
      filasUbicacion.push(['Puntos', 'Latitud N', 'Longitud E'].map((c) => coordenada(c, true)));
      if (sitio.coordenadasTitulo) filasUbicacion.push([coordenada(sitio.coordenadasTitulo, true, 3)]);
      sitio.coordenadas.forEach((c) => filasUbicacion.push([coordenada(c.punto), coordenada(c.norte), coordenada(c.este)]));
    }
    filasUbicacion.forEach((celdas, i) =>
      filasFicha.push(
        new d.TableRow({
          cantSplit: true,
          children: [
            celda(i === 0 ? [etiqueta('Ubicación geográfica del Proyecto:')] : [parrafo([])], {
              verticalMerge: filasUbicacion.length > 1 ? (i === 0 ? VerticalMergeType.RESTART : VerticalMergeType.CONTINUE) : undefined,
              borders: { top: i === 0 ? LINEA : NADA, bottom: i === filasUbicacion.length - 1 ? LINEA : NADA, left: LINEA, right: LINEA },
            }),
            ...celdas,
          ],
        }),
      ),
    );
    fila('Superficie del proyecto:', sitio.superficie);

    return new d.Table({
      alignment: AlignmentType.CENTER,
      layout: d.TableLayoutType.FIXED,
      width: { size: px(ANCHOS.reduce((a, b) => a + b, 0)), type: WidthType.DXA },
      columnWidths: ANCHOS.map(px),
      rows: filasFicha,
    });
  }

  /* ---------- tabla de resultados (8 pt) ---------- */
  function tablaResultados() {
    const ANCHOS = [137, 65, 105, 96];
    const bordes = { top: LINEA, bottom: LINEA, left: LINEA, right: LINEA };
    const celda = (texto: string, o: { gris?: boolean; izquierda?: boolean; excede?: boolean } = {}) =>
      new d.TableCell({
        borders: bordes,
        margins: { left: px(5), right: px(5) },
        verticalAlign: VerticalAlign.CENTER,
        shading: o.gris ? { type: ShadingType.CLEAR, fill: GRIS, color: 'auto' } : o.excede ? { type: ShadingType.CLEAR, fill: 'FBD5D5', color: 'auto' } : undefined,
        children: [
          parrafo([t(texto, 8, { bold: o.gris || o.excede, color: o.excede ? 'C00000' : undefined })], {
            alignment: o.izquierda ? AlignmentType.LEFT : AlignmentType.CENTER,
          }),
        ],
      });
    const alto = { value: px(30), rule: HeightRule.ATLEAST };
    return new d.Table({
      alignment: AlignmentType.CENTER,
      layout: d.TableLayoutType.FIXED,
      width: { size: px(ANCHOS.reduce((a, b) => a + b, 0)), type: WidthType.DXA },
      columnWidths: ANCHOS.map(px),
      rows: [
        new d.TableRow({
          tableHeader: true,
          cantSplit: true,
          height: alto,
          children: ['Parámetros', 'Unidades', 'Resultados de Efluentes *', 'Límite máximo permisible**'].map((c) => celda(c, { gris: true })),
        }),
        ...filas.map(
          (f) =>
            new d.TableRow({
              cantSplit: true,
              height: alto,
              children: [
                celda(f.nombre, { izquierda: !larvas }),
                celda(f.unidad),
                celda(f.estado === 'no-cumple' ? `${f.valor} ▲` : f.valor, { excede: f.estado === 'no-cumple' }),
                celda(f.limite),
              ],
            }),
        ),
      ],
    });
  }

  /* ---------- encabezado de doble borde (la primera hoja lleva Revisión y Fecha) ---------- */
  function encabezado(primera: boolean) {
    const anchos = primera ? [131, 384, 130] : [121, 375, 119];
    const altos = primera ? [25, 25, 25, 46] : [37, 41];
    const bordes = { top: DOBLE, bottom: DOBLE, left: DOBLE, right: DOBLE };
    const centrado = (hijos: ParagraphChild[]) => parrafo(hijos, { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 } });
    const pagina = [t('Pág.', 12, { bold: true }), new d.TextRun({ font: FUENTE, size: 24, children: [' ', PageNumber.CURRENT, '/', PageNumber.TOTAL_PAGES] })];
    const datos: ParagraphChild[][] = primera
      ? [[t('PGC-025', 12, { bold: true })], [t('Revisión:', 12, { bold: true }), t(' 0', 12)], pagina]
      : [[t('PGC-025', 12, { bold: true })], pagina];

    // Logo: alto máximo como en la vista y sin pasar el ancho de la celda
    const altoLogo = logos.length > 1 ? 34 : primera ? 70 : 50;
    const imagenes = logos.map((l) => {
      const escala = Math.min(altoLogo / l.alto, (anchos[0] - 10) / l.ancho);
      return centrado([new d.ImageRun({ type: 'png', data: l.datos, transformation: { width: Math.round(l.ancho * escala), height: Math.round(l.alto * escala) } })]);
    });
    const celdaLogo = new d.TableCell({
      rowSpan: altos.length,
      borders: bordes,
      margins: { left: px(5), right: px(5) },
      verticalAlign: VerticalAlign.CENTER,
      children: imagenes.length ? imagenes : [centrado([t(sitio.logoTexto, 10, { bold: true })])],
    });
    const celdaTitulo = new d.TableCell({
      rowSpan: altos.length,
      borders: bordes,
      margins: { left: px(5), right: px(5) },
      verticalAlign: VerticalAlign.CENTER,
      children: [centrado([t('INFORME DE MONITOREO DEL ANÁLISIS DE AGUA DEL EFLUENTE', 12, { bold: true }), new d.TextRun({ break: 1 }), t(tituloEncabezado, 12, { bold: true })])],
    });
    const celdaDato = (hijos: ParrafoDocx[]) => new d.TableCell({ borders: bordes, verticalAlign: VerticalAlign.CENTER, children: hijos });

    const filasEnc = altos.map(
      (h, i) =>
        new d.TableRow({
          height: { value: px(h), rule: HeightRule.EXACT },
          children: [
            ...(i === 0 ? [celdaLogo, celdaTitulo] : []),
            i < datos.length
              ? celdaDato([centrado(datos[i])])
              : celdaDato([centrado([t('Fecha:', 12, { bold: true })]), centrado([t(fechaInforme(resultado.fechaMuestreo), 12)])]),
          ],
        }),
    );
    return new d.Header({
      children: [
        new d.Table({
          alignment: AlignmentType.CENTER,
          layout: d.TableLayoutType.FIXED,
          width: { size: px(anchos.reduce((a, b) => a + b, 0)), type: WidthType.DXA },
          columnWidths: anchos.map(px),
          rows: filasEnc,
        }),
        parrafo([], { spacing: { before: 0, after: 0 } }),
      ],
    });
  }

  const pie = new d.Footer({
    children: [
      parrafo([t('Naturisa S.A.', 12, { italics: true })], {
        alignment: AlignmentType.RIGHT,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 1 } },
      }),
    ],
  });

  const documento = new d.Document({
    creator: 'SIG Naturisa',
    title: `Informe de Monitoreo PGC-025 · ${sitio.nombre}`,
    styles: { default: { document: { run: { font: FUENTE, size: 24 } } } },
    sections: [
      {
        properties: {
          titlePage: true,
          page: {
            size: { width: px(794), height: px(1123) },
            // Márgenes del Word: 2,54 cm; el encabezado empieza a 1,32 cm del borde
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440, header: px(50), footer: px(38) },
          },
        },
        headers: { first: encabezado(true), default: encabezado(false) },
        footers: { first: pie, default: pie },
        children: cuerpo,
      },
    ],
  });
  return d.Packer.toBlob(documento);
}

/** Varios informes en un .zip, un Word por informe; avisa el avance (hechos de total) */
export async function informesAZip(
  informes: { sitio: Sitio; resultado: Resultado }[],
  definicion: DefinicionMonitoreo,
  nombreDe: (sitio: Sitio, resultado: Resultado) => string,
  alAvanzar: (hechos: number) => void,
): Promise<Blob> {
  const { zipSync } = await import('fflate');
  const archivos: Record<string, Uint8Array> = {};
  for (const [i, { sitio, resultado }] of informes.entries()) {
    const docx = new Uint8Array(await (await informeAWord(sitio, resultado, definicion)).arrayBuffer());
    // Dos informes con el mismo nombre (misma camaronera y fecha) no se pisan
    let nombre = `${nombreDe(sitio, resultado)}.docx`;
    for (let n = 2; archivos[nombre]; n++) nombre = `${nombreDe(sitio, resultado)} (${n}).docx`;
    archivos[nombre] = docx;
    alAvanzar(i + 1);
  }
  // Los .docx ya vienen comprimidos: se guardan tal cual
  return new Blob([zipSync(archivos, { level: 0 })], { type: 'application/zip' });
}
