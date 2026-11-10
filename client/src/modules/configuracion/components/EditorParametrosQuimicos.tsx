import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Undo2, X } from 'lucide-react';
import { CLASE_CONTROL } from '@/components/forms/Campo';
import { Card } from '@/components/ui/Card';
import { olvidarDefinicion } from '@/modules/laboratorios/analisis/hooks/useDefinicion';
import {
  guardarParametrosQuimicos,
  obtenerParametrosQuimicos,
  restaurarParametrosQuimicos,
} from '@/modules/laboratorios/analisis/services/laboratorio.api';
import type { ParametroQuimico, ParametrosQuimicos } from '@/modules/laboratorios/analisis/types';

/** Fila en edición: los números como texto, tal como se escriben */
interface Fila {
  /** Identifica la fila mientras se edita (los nuevos aún no tienen clave) */
  id: string;
  clave?: string;
  nombre: string;
  formula: string;
  unidad: string;
  min: string;
  max: string;
  factor: string;
  oculto: boolean;
}

const aTexto = (n: number | undefined) => (n == null ? '' : String(n).replace('.', ','));
const aNumero = (t: string): number | undefined | null => {
  const s = t.trim().replace(',', '.');
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

let siguiente = 0;
const aFila = (p: ParametroQuimico): Fila => ({
  id: p.clave ?? `nuevo-${siguiente++}`,
  clave: p.clave,
  nombre: p.nombre,
  formula: p.formula,
  unidad: p.unidad,
  min: aTexto(p.min),
  max: aTexto(p.max),
  factor: aTexto(p.factorSalinidad),
  oculto: Boolean(p.oculto),
});

const CELDA = `${CLASE_CONTROL} w-full min-w-0 px-2 py-1 text-[13px]`;
const BOTON_ICONO = 'rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-500 disabled:opacity-30 dark:hover:bg-slate-800';

/**
 * Parámetros del análisis químico de agua: se agregan, se quitan, se ordenan y se cambian su fórmula, unidad y
 * referencia (rango mín.–máx. o factor × salinidad). Al guardar, el formulario de resultados y el informe impreso
 * los usan. Un parámetro quitado sigue saliendo en los informes que ya tienen su valor.
 */
export function EditorParametrosQuimicos() {
  const [datos, setDatos] = useState<ParametrosQuimicos | null>(null);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cambios, setCambios] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(null);

  const cargar = (d: ParametrosQuimicos) => {
    setDatos(d);
    setFilas(d.parametros.map(aFila));
    setCambios(false);
  };

  useEffect(() => {
    obtenerParametrosQuimicos()
      .then(cargar)
      .catch((e) => setMensaje({ texto: (e as Error).message, error: true }));
  }, []);

  const editar = (cambio: (f: Fila[]) => Fila[]) => {
    setFilas(cambio);
    setCambios(true);
    setMensaje(null);
  };
  const cambiar = (id: string, campo: keyof Fila, valor: string) => editar((fs) => fs.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)));
  const visibles = filas.filter((f) => !f.oculto);
  const quitados = filas.filter((f) => f.oculto);

  const mover = (id: string, paso: -1 | 1) =>
    editar((fs) => {
      const vis = fs.filter((f) => !f.oculto);
      const i = vis.findIndex((f) => f.id === id);
      const j = i + paso;
      if (j < 0 || j >= vis.length) return fs;
      [vis[i], vis[j]] = [vis[j], vis[i]];
      return [...vis, ...fs.filter((f) => f.oculto)];
    });

  const quitar = (f: Fila) => {
    if (visibles.length === 1) {
      setMensaje({ texto: 'Deje al menos un parámetro químico.', error: true });
      return;
    }
    // Uno nuevo que aún no se guardó simplemente desaparece
    editar((fs) => (f.clave ? fs.map((x) => (x.id === f.id ? { ...x, oculto: true } : x)) : fs.filter((x) => x.id !== f.id)));
  };

  const volverAPoner = (f: Fila) => editar((fs) => [...fs.filter((x) => !x.oculto), { ...f, oculto: false }, ...fs.filter((x) => x.oculto && x.id !== f.id)]);

  const agregar = () =>
    editar((fs) => [...fs.filter((x) => !x.oculto), { ...aFila({ nombre: '', formula: '', unidad: 'mg/L' }), id: `nuevo-${siguiente++}` }, ...fs.filter((x) => x.oculto)]);

  async function guardar() {
    const parametros: ParametroQuimico[] = [];
    for (const f of filas) {
      const nombre = f.nombre.trim();
      if (!nombre) {
        setMensaje({ texto: 'Escriba el nombre de cada parámetro (o quite la fila vacía).', error: true });
        return;
      }
      const [min, max, factor] = [aNumero(f.min), aNumero(f.max), aNumero(f.factor)];
      if (min === null || max === null || factor === null) {
        setMensaje({ texto: `Revise los números de referencia de "${nombre}".`, error: true });
        return;
      }
      parametros.push({
        clave: f.clave,
        nombre,
        formula: f.formula.trim(),
        unidad: f.unidad.trim(),
        ...(factor !== undefined ? { factorSalinidad: factor } : { min, max }),
        ...(f.oculto ? { oculto: true } : {}),
      });
    }
    setOcupado(true);
    try {
      cargar(await guardarParametrosQuimicos(parametros));
      olvidarDefinicion();
      setMensaje({ texto: 'Parámetros guardados. Se usan desde el próximo informe que abra.' });
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setOcupado(false);
    }
  }

  async function restaurar() {
    const nombres = datos?.iniciales.map((p) => p.nombre).join(', ');
    if (!window.confirm(`¿Volver a los parámetros de fábrica? (${nombres})\nLos que agregó quedan quitados; los informes que ya los tienen no cambian.`)) return;
    setOcupado(true);
    try {
      cargar(await restaurarParametrosQuimicos());
      olvidarDefinicion();
      setMensaje({ texto: 'Parámetros de fábrica restaurados.' });
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Card
      compact
      title="Parámetros del análisis químico"
      subtitle="Columnas de la tabla química del informe de Análisis de Agua. La referencia es un rango (mín. – máx.) o un factor que se multiplica por la salinidad de la muestra."
      actions={
        datos?.editados && (
          <button
            type="button"
            onClick={restaurar}
            disabled={ocupado}
            title="Volver a los parámetros de fábrica"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-500 hover:underline"
          >
            <RotateCcw size={13} /> Restaurar
          </button>
        )
      }
    >
      {!datos && !mensaje && <p className="text-sm text-slate-500">Cargando…</p>}
      {datos && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-x-1.5 border-spacing-y-1 text-[13px]">
              <thead className="text-left text-xs text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="w-14 font-semibold">Orden</th>
                  <th className="font-semibold">Parámetro</th>
                  <th className="w-28 font-semibold" title="Encabezado de la columna en el informe impreso">
                    Fórmula
                  </th>
                  <th className="w-24 font-semibold">Unidad</th>
                  <th className="w-20 font-semibold">Ref. mín.</th>
                  <th className="w-20 font-semibold">Ref. máx.</th>
                  <th className="w-24 font-semibold" title="Referencia = factor × salinidad (como Ca, Mg y K)">
                    × salinidad
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {visibles.map((f, i) => {
                  const conFactor = f.factor.trim() !== '';
                  return (
                    <tr key={f.id}>
                      <td className="whitespace-nowrap">
                        <button type="button" onClick={() => mover(f.id, -1)} disabled={ocupado || i === 0} aria-label={`Subir ${f.nombre}`} className={BOTON_ICONO}>
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => mover(f.id, 1)}
                          disabled={ocupado || i === visibles.length - 1}
                          aria-label={`Bajar ${f.nombre}`}
                          className={BOTON_ICONO}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </td>
                      <td>
                        <input value={f.nombre} onChange={(e) => cambiar(f.id, 'nombre', e.target.value)} maxLength={40} placeholder="Ej. Sílice" aria-label="Parámetro" className={CELDA} />
                      </td>
                      <td>
                        <input value={f.formula} onChange={(e) => cambiar(f.id, 'formula', e.target.value)} maxLength={20} placeholder="Ej. SiO₂" aria-label={`Fórmula de ${f.nombre}`} className={CELDA} />
                      </td>
                      <td>
                        <input value={f.unidad} onChange={(e) => cambiar(f.id, 'unidad', e.target.value)} maxLength={20} aria-label={`Unidad de ${f.nombre}`} className={CELDA} />
                      </td>
                      <td>
                        <input
                          value={conFactor ? '' : f.min}
                          onChange={(e) => cambiar(f.id, 'min', e.target.value)}
                          disabled={conFactor}
                          inputMode="decimal"
                          aria-label={`Referencia mínima de ${f.nombre}`}
                          className={`${CELDA} disabled:opacity-40`}
                        />
                      </td>
                      <td>
                        <input
                          value={conFactor ? '' : f.max}
                          onChange={(e) => cambiar(f.id, 'max', e.target.value)}
                          disabled={conFactor}
                          inputMode="decimal"
                          aria-label={`Referencia máxima de ${f.nombre}`}
                          className={`${CELDA} disabled:opacity-40`}
                        />
                      </td>
                      <td>
                        <input value={f.factor} onChange={(e) => cambiar(f.id, 'factor', e.target.value)} inputMode="decimal" aria-label={`Factor de salinidad de ${f.nombre}`} className={CELDA} />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => quitar(f)}
                          disabled={ocupado}
                          aria-label={`Quitar ${f.nombre || 'parámetro'}`}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                        >
                          <X size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={agregar}
              disabled={ocupado}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <Plus size={15} /> Agregar parámetro
            </button>
            <span className="flex-1" />
            {cambios && (
              <button type="button" onClick={() => datos && cargar(datos)} disabled={ocupado} className="px-2 text-sm font-semibold text-slate-500 hover:underline">
                Descartar
              </button>
            )}
            <button
              type="button"
              onClick={guardar}
              disabled={ocupado || !cambios}
              className="rounded-lg bg-brand-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 dark:bg-sky-600"
            >
              {ocupado ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>

          {quitados.length > 0 && (
            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
              <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">
                Quitados: no salen en los informes nuevos; los que ya tienen su valor lo siguen mostrando.
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {quitados.map((f) => (
                  <li key={f.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {f.nombre} {f.formula && <span className="text-slate-400">{f.formula}</span>}
                    <button
                      type="button"
                      onClick={() => volverAPoner(f)}
                      disabled={ocupado}
                      title="Volver a ponerlo"
                      aria-label={`Volver a poner ${f.nombre}`}
                      className="rounded-full p-0.5 text-slate-400 hover:bg-sky-50 hover:text-brand-500 dark:hover:bg-sky-500/10"
                    >
                      <Undo2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {mensaje && (
        <p role="status" className={`mt-2 text-xs ${mensaje.error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
          {mensaje.texto}
        </p>
      )}
    </Card>
  );
}
