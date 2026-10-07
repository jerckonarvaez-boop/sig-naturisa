import { useEffect, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { Tabla } from '@/components/tables/Tabla';
import { Card } from '@/components/ui/Card';
import { dinero, miles } from '@/utils/numeros';
import { exportarDetalleCsv } from '../logic/exportarDetalle';
import { ordenarRegistros, totalGasto } from '../logic/logica';
import type { Registro } from '../types';
import { COLUMNAS, type ColumnaOrden } from './columnasDetalle';

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

  const ordenados = useMemo(() => ordenarRegistros(registros, orden.col, orden.dir), [registros, orden]);

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
            onClick={() => exportarDetalleCsv(ordenados)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:underline"
          >
            <Download size={15} /> Exportar a Excel (CSV)
          </button>
        </div>
      </div>

      <Tabla anchoMinimo="min-w-[960px]">
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
      </Tabla>

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
