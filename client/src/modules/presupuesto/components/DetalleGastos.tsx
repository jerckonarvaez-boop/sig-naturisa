import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, Search } from 'lucide-react';
import { Card } from '@/components/Card';
import { dinero, fechaCorta, miles } from '../formato';
import { totalGasto } from '../logica';
import type { Registro } from '../types';

type ColumnaOrden = 'fechaSolped' | 'notaGeneral' | 'item' | 'subarea' | 'sucursalNombre' | 'estado' | 'cantidad' | 'precioUnitario' | 'total';

interface Columna {
  clave: ColumnaOrden;
  titulo: string;
  numerica?: boolean;
  celda: (r: Registro) => ReactNode;
}

const Secundario = ({ children }: { children: string }) =>
  children ? (
    <span className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400" title={children}>
      {children}
    </span>
  ) : null;

/** Texto principal de celda, limitado a 2 líneas */
const Principal = ({ children }: { children: string }) => (
  <span className="line-clamp-2" title={children}>
    {children}
  </span>
);

const COLUMNAS: Columna[] = [
  { clave: 'fechaSolped', titulo: 'Fecha', celda: (r) => fechaCorta(r.fechaSolped) },
  { clave: 'notaGeneral', titulo: 'Nota general', celda: (r) => <><Principal>{r.notaGeneral}</Principal><Secundario>{r.solped}</Secundario></> },
  { clave: 'item', titulo: 'Ítem', celda: (r) => <><Principal>{r.item}</Principal><Secundario>{r.notaPosicion}</Secundario></> },
  { clave: 'subarea', titulo: 'Sub-área', celda: (r) => <><Principal>{r.subarea}</Principal><Secundario>{r.area}</Secundario></> },
  {
    clave: 'sucursalNombre',
    titulo: 'Sucursal',
    celda: (r) => <>{r.sucursalNombre}<Secundario>{r.cluster !== r.sucursal ? r.cluster : ''}</Secundario></>,
  },
  {
    clave: 'estado',
    titulo: 'Estado',
    celda: (r) =>
      r.estado && (
        <span className="inline-block rounded-full border border-slate-300 px-2 py-0.5 text-xs font-medium whitespace-nowrap dark:border-slate-600">
          {r.estado}
        </span>
      ),
  },
  { clave: 'cantidad', titulo: 'Cantidad', numerica: true, celda: (r) => miles(r.cantidad, r.cantidad % 1 ? 2 : 0) },
  { clave: 'precioUnitario', titulo: 'Costo unitario', numerica: true, celda: (r) => dinero(r.precioUnitario, 2) },
  { clave: 'total', titulo: 'Total', numerica: true, celda: (r) => dinero(r.total, 2) },
];

const POR_PAGINA = 25;

interface DetalleGastosProps {
  registros: Registro[];
  busqueda: string;
  onBuscar: (texto: string) => void;
}

/** Tabla de gastos con búsqueda, orden por columna, paginación y exportación a CSV. */
export function DetalleGastos({ registros, busqueda, onBuscar }: DetalleGastosProps) {
  const [orden, setOrden] = useState<{ col: ColumnaOrden; dir: 1 | -1 }>({ col: 'total', dir: -1 });
  const [limite, setLimite] = useState(POR_PAGINA);
  const [texto, setTexto] = useState(busqueda);

  // La búsqueda se aplica 200 ms después de dejar de escribir
  useEffect(() => {
    const t = setTimeout(() => onBuscar(texto.trim()), 200);
    return () => clearTimeout(t);
  }, [texto, onBuscar]);
  // Si la búsqueda se borra desde fuera (chip "Quitar" o cambio de área), limpia el cuadro
  useEffect(() => {
    if (!busqueda) setTexto('');
  }, [busqueda]);
  useEffect(() => setLimite(POR_PAGINA), [registros]);

  const ordenados = useMemo(() => {
    const { col, dir } = orden;
    return [...registros].sort((a, b) => {
      const x = a[col];
      const y = b[col];
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * dir;
    });
  }, [registros, orden]);

  const total = totalGasto(registros);

  function ordenarPor(col: ColumnaOrden, numerica?: boolean) {
    setOrden((o) => ({ col, dir: o.col === col ? (o.dir === 1 ? -1 : 1) : numerica || col === 'fechaSolped' ? -1 : 1 }));
  }

  return (
    <Card compact>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Detalle de gastos</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {miles(registros.length)} registros · {dinero(total, 2)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar solped, ítem, proveedor, sucursal…"
              aria-label="Buscar en el detalle"
              className="w-72 max-w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <button
            type="button"
            onClick={() => exportarCSV(ordenados)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:underline"
          >
            <Download size={15} /> Exportar a Excel (CSV)
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[960px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              {COLUMNAS.map((c) => (
                <th
                  key={c.clave}
                  aria-sort={orden.col === c.clave ? (orden.dir === 1 ? 'ascending' : 'descending') : 'none'}
                  className={`border-b border-slate-200 px-3 py-1.5 font-semibold whitespace-nowrap text-brand-900 dark:border-slate-700 dark:text-slate-200 ${c.numerica ? 'text-right' : 'text-left'}`}
                >
                  <button type="button" onClick={() => ordenarPor(c.clave, c.numerica)} className="hover:underline">
                    {c.titulo}
                    {orden.col === c.clave && <span className="ml-1 text-brand-500">{orden.dir === 1 ? '▲' : '▼'}</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenados.slice(0, limite).map((r, i) => (
              <tr key={i} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                {COLUMNAS.map((c) => (
                  <td
                    key={c.clave}
                    className={`border-b border-slate-100 px-3 py-1.5 dark:border-slate-800 ${c.numerica ? 'text-right tabular-nums' : ''}`}
                  >
                    {c.celda(r)}
                  </td>
                ))}
              </tr>
            ))}
            {!ordenados.length && (
              <tr>
                <td colSpan={COLUMNAS.length} className="py-10 text-center text-slate-500">
                  No hay registros con estos filtros
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-semibold dark:bg-slate-800/60">
              <td colSpan={COLUMNAS.length - 1} className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{dinero(total, 2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {ordenados.length > limite && (
        <button
          type="button"
          onClick={() => setLimite((l) => l + 60)}
          className="mx-auto mt-3 block text-sm font-semibold text-brand-500 hover:underline"
        >
          Mostrar {Math.min(60, ordenados.length - limite)} más (de {miles(ordenados.length - limite)} restantes)
        </button>
      )}
    </Card>
  );
}

function exportarCSV(registros: Registro[]) {
  const cabecera = [
    'Fecha solped', 'Área', 'Sub-área', 'Clúster', 'Sucursal', 'Nota general', 'Ítem', 'Nota posición',
    'Estado', 'Solped', 'Proveedor', 'Cantidad', 'P.U.', 'Total', 'OC ERP', 'Fecha OC',
  ];
  const celda = (v: string | number) => {
    const s = typeof v === 'number' ? String(v).replace('.', ',') : v;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lineas = [
    cabecera.join(';'),
    ...registros.map((r) =>
      [
        r.fechaSolped, r.area, r.subarea, r.cluster, r.sucursal, r.notaGeneral, r.item, r.notaPosicion,
        r.estado, r.solped, r.proveedor, r.cantidad, r.precioUnitario, r.total, r.ocErp, r.fechaOc,
      ].map(celda).join(';'),
    ),
  ];
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Detalle_presupuesto_SIG_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}
