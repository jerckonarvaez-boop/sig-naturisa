/**
 * Descarga un archivo CSV que Excel abre directamente (separador ";", coma decimal y BOM UTF-8
 * para que respete tildes y eñes).
 */
export function descargarCsv(nombreArchivo: string, cabecera: string[], filas: (string | number)[][]) {
  const celda = (v: string | number) => {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [cabecera.join(';'), ...filas.map((f) => f.map(celda).join(';'))];
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}
