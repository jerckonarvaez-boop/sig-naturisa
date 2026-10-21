import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { CLASE_CONTROL } from '@/components/forms/Campo';
import { FILA_ENCABEZADO, Tabla } from '@/components/tables/Tabla';
import { evaluar, parametroDe } from '../logic/monitoreo';
import type { PuntoMonitoreo } from '../meta';
import type { DefinicionMonitoreo, ValorParametro } from '../types';

interface EditorParametrosProps {
  definicion: DefinicionMonitoreo;
  punto: PuntoMonitoreo;
  valores: ValorParametro[];
  onCambiar: (valores: ValorParametro[]) => void;
}

/** Enter baja al resultado del siguiente parámetro */
function bajarConEnter(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const campos = [...document.querySelectorAll<HTMLInputElement>('input[data-resultado]')];
  campos[campos.indexOf(e.currentTarget) + 1]?.focus();
}

/**
 * Parámetros del resultado: uno por fila, en el orden del informe. El efluente se compara al momento con el límite
 * máximo permisible (AM 097a); el afluente no tiene límite de descarga.
 */
export function EditorParametros({ definicion, punto, valores, onCambiar }: EditorParametrosProps) {
  const disponibles = definicion.parametros.filter((p) => !valores.some((v) => v.clave === p.clave));
  const cambiar = (clave: string, valor: string) => onCambiar(valores.map((v) => (v.clave === clave ? { ...v, valor } : v)));

  return (
    <>
      <Tabla anchoMinimo="min-w-[640px]">
        <thead>
          <tr className={FILA_ENCABEZADO}>
            <th className="px-3 py-2 font-semibold">Parámetro</th>
            <th className="px-3 py-2 font-semibold">Unidad</th>
            <th className="w-40 px-3 py-2 font-semibold">Resultado</th>
            {punto === 'efluente' && <th className="px-3 py-2 font-semibold">Límite máx. permisible</th>}
            <th className="w-10 px-1 py-2" />
          </tr>
        </thead>
        <tbody>
          {valores.map((v) => {
            const p = parametroDe(definicion, v.clave);
            const estado = punto === 'efluente' ? evaluar(p, v.valor) : null;
            return (
              <tr key={v.clave} className="border-t border-slate-100 dark:border-slate-800">
                <td className="px-3 py-1.5">{p?.nombre ?? v.clave}</td>
                <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">{p?.unidad}</td>
                <td className="px-3 py-1.5">
                  <input
                    data-resultado
                    value={v.valor}
                    maxLength={40}
                    onChange={(e) => cambiar(v.clave, e.target.value)}
                    onKeyDown={bajarConEnter}
                    aria-label={`Resultado de ${p?.nombre ?? v.clave}`}
                    placeholder="Ej. 11,04"
                    className={`${CLASE_CONTROL} ${
                      estado === 'no-cumple' ? 'border-red-500 bg-red-50 font-bold text-red-700 dark:bg-red-500/10 dark:text-red-300' : ''
                    }`}
                  />
                </td>
                {punto === 'efluente' && (
                  <td className="px-3 py-1.5">
                    {p?.limite}
                    {estado === 'no-cumple' && <span className="ml-2 text-xs font-bold text-red-600 dark:text-red-400">▲ Supera</span>}
                    {estado === 'cumple' && <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">✓ Cumple</span>}
                  </td>
                )}
                <td className="px-1 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => onCambiar(valores.filter((x) => x.clave !== v.clave))}
                    aria-label={`Quitar ${p?.nombre ?? v.clave}`}
                    title="Quitar parámetro"
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                  >
                    <X size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Tabla>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="agregar-parametro" className="font-semibold text-slate-600 dark:text-slate-300">
          Agregar parámetro:
        </label>
        <select
          id="agregar-parametro"
          value=""
          onChange={(e) => e.target.value && onCambiar([...valores, { clave: e.target.value, valor: '' }])}
          className={`${CLASE_CONTROL} w-auto max-w-full`}
        >
          <option value="">Elegir del catálogo (AM 097a)…</option>
          {disponibles.map((p) => (
            <option key={p.clave} value={p.clave}>
              {p.nombre} ({p.unidad})
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Escriba el resultado como lo reporta el laboratorio (ej. 11,04 · &lt;0,27 · Ausencia). Enter baja al siguiente parámetro. Los
        parámetros sin resultado no salen en el informe.
      </p>
    </>
  );
}
