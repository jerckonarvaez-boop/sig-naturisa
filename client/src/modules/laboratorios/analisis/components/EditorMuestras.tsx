import { Fragment, useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { SelectorMultiple } from '@/components/forms/SelectorMultiple';
import { Card } from '@/components/ui/Card';
import { miles } from '@/utils/numeros';
import type { MuestraForm } from '../hooks/useInformeForm';
import {
  aNumero,
  camposDelTipo,
  camposVisibles,
  CLAVES_FITOPLANCTON,
  ESTADOS_REFERENCIA,
  evaluarReferencia,
  gruposDelTipo,
  NIVELES_PATOLOGIA,
  quimicosDelInforme,
  textoReferencia,
  tipoUnaMuestra,
} from '../logic/laboratorio';
import type { CampoLab, GrupoLab, ParametroQuimico, SeccionLab } from '../types';

interface EditorMuestrasProps {
  seccion: SeccionLab;
  tipo: string;
  muestras: MuestraForm[];
  /** Parámetros químicos elegidos para este informe (null = los vigentes en Configuración) */
  parametros: string[] | null;
  onAgregar: () => void;
  onQuitar: (i: number) => void;
  onRenombrar: (i: number, nombre: string) => void;
  onValor: (i: number, clave: string, valor: string) => void;
  onQuitarParametro: (clave: string) => void;
  onAgregarParametro: (clave: string) => void;
  /** Crea un parámetro químico nuevo (queda en Configuración) y lo agrega a este informe */
  onCrearParametro: (p: ParametroQuimico) => Promise<void>;
}

const CELDA = 'w-full min-w-24 rounded border border-slate-300 bg-white px-2 py-1 text-[13px] focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950';
/** Casilla del conteo cuando a su derecha va el selector de géneros */
const CELDA_CORTA = CELDA.replace('w-full min-w-24', 'w-20 shrink-0');
const BOTON_QUITAR = 'rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 print:hidden';

/**
 * Resultados en el formato del informe. El fitoplancton va horizontal (una fila por muestra y los grupos como
 * columnas, como en el informe impreso); lo demás, con los parámetros en filas y una columna por muestra. En el
 * análisis químico las filas de parámetros se quitan o agregan para este informe.
 */
export function EditorMuestras({
  seccion,
  tipo,
  muestras,
  parametros,
  onAgregar,
  onQuitar,
  onRenombrar,
  onValor,
  onQuitarParametro,
  onAgregarParametro,
  onCrearParametro,
}: EditorMuestrasProps) {
  const delTipo = camposDelTipo(seccion, tipo);
  const campos = camposVisibles(delTipo, muestras).filter((c) => c.grupo !== 'quimica');
  const quimicos = delTipo.some((c) => c.grupo === 'quimica') ? quimicosDelInforme(seccion.campos, parametros, muestras) : [];
  const disponibles = seccion.campos.filter((c) => c.grupo === 'quimica' && !quimicos.includes(c));
  const grupos = gruposDelTipo(seccion, tipo);
  const fito = grupos.find((g) => g.id === 'fitoplancton');
  const verticales = grupos.filter((g) => g.id !== 'fitoplancton');
  const unaMuestra = tipoUnaMuestra(seccion, tipo);
  const columnas = muestras.length + 1;
  const etiqueta = seccion.etiquetaMuestra;

  const quitarParametro = (c: CampoLab) => {
    const conValor = muestras.some((m) => (m.valores[c.clave] ?? '').trim());
    if (conValor && !window.confirm(`¿Quitar "${c.etiqueta}" de este informe? Se borran sus valores.`)) return;
    onQuitarParametro(c.clave);
  };

  return (
    <Card compact title="Resultados" subtitle="Deje vacío (o escriba -) lo que no se analizó">
      <div className="flex flex-col gap-4">
        {fito && (
          <TablaFitoplancton
            grupo={fito}
            campos={campos}
            muestras={muestras}
            etiqueta={etiqueta}
            placeholder={seccion.id === 'suelo' ? 'Ej. 99' : 'Ej. PS-79'}
            onQuitar={onQuitar}
            onRenombrar={onRenombrar}
            onValor={onValor}
          />
        )}

        {verticales.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-[13px]" onKeyDown={bajarConEnter}>
              <thead>
                <tr className="bg-slate-50 text-left text-brand-900 dark:bg-slate-800/60 dark:text-slate-200">
                  <th className="sticky left-0 z-10 min-w-52 bg-slate-50 px-3 py-2 font-semibold dark:bg-slate-800">{etiqueta}</th>
                  {muestras.map((m, i) => (
                    <th key={i} className="px-2 py-2 align-top font-semibold">
                      <div className="flex items-center gap-1">
                        <input
                          value={m.nombre}
                          onChange={(e) => onRenombrar(i, e.target.value)}
                          maxLength={40}
                          placeholder={seccion.id === 'suelo' ? 'Ej. 99' : 'Ej. PS-79'}
                          aria-label={`Nombre de la ${etiqueta.toLowerCase()} ${i + 1}`}
                          data-col={i}
                          className={`${CELDA} font-semibold`}
                        />
                        {muestras.length > 1 && (
                          <button type="button" onClick={() => onQuitar(i)} aria-label={`Quitar ${m.nombre || `la columna ${i + 1}`}`} className={BOTON_QUITAR}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {verticales.map((g) => (
                  <Fragment key={g.id}>
                    <tr className="border-t border-slate-200 bg-sky-50/60 dark:border-slate-700 dark:bg-sky-500/5">
                      <td colSpan={columnas} className="px-3 py-1.5">
                        <span className="font-semibold">{g.nombre}</span>
                        {g.nota && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{g.nota}</span>}
                      </td>
                    </tr>
                    {g.id === 'quimica' ? (
                      <>
                        {quimicos.map((c) => (
                          <FilaCampo key={c.clave} campo={c} muestras={muestras} onValor={onValor} onQuitar={() => quitarParametro(c)} />
                        ))}
                        <FilaAgregarParametro columnas={columnas} disponibles={disponibles} onAgregar={onAgregarParametro} onCrear={onCrearParametro} />
                      </>
                    ) : (
                      campos
                        .filter((c) => c.grupo === g.id && !c.junto)
                        .map((c) => (
                          <FilaCampo key={c.clave} campo={c} acompanante={campos.find((x) => x.junto === c.clave)} muestras={muestras} onValor={onValor} />
                        ))
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!unaMuestra && (
        <button type="button" onClick={onAgregar} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline print:hidden">
          <Plus size={15} /> Agregar {etiqueta.toLowerCase()}
        </button>
      )}
    </Card>
  );
}

/**
 * Enter en una casilla baja a la siguiente casilla de la misma muestra (columna), para llenar seguido sin el ratón.
 * En los textos, Mayús + Enter hace un salto de línea.
 */
function bajarConEnter(e: KeyboardEvent<HTMLTableElement>) {
  if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
  const actual = e.target as HTMLElement;
  const col = actual.dataset.col;
  if (col == null) return;
  e.preventDefault();
  const casillas = [...e.currentTarget.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(`[data-col="${col}"]`)];
  const siguiente = casillas[casillas.indexOf(actual as HTMLInputElement) + 1];
  if (siguiente) {
    siguiente.focus();
    siguiente.select();
  }
}

interface TablaFitoplanctonProps {
  grupo: GrupoLab;
  campos: CampoLab[];
  muestras: MuestraForm[];
  etiqueta: string;
  placeholder: string;
  onQuitar: (i: number) => void;
  onRenombrar: (i: number, nombre: string) => void;
  onValor: (i: number, clave: string, valor: string) => void;
}

/**
 * Fitoplancton en horizontal: una fila por muestra y los grupos (diatomeas, cianofitas…) como columnas, cada uno
 * con su conteo y sus géneros. Enter baja a la misma casilla de la muestra siguiente.
 */
function TablaFitoplancton({ grupo, campos, muestras, etiqueta, placeholder, onQuitar, onRenombrar, onValor }: TablaFitoplanctonProps) {
  const conteos = campos.filter((c) => c.grupo === 'fitoplancton' && !c.junto);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-[13px]" onKeyDown={bajarConEnter}>
        <thead>
          <tr className="border-b border-slate-200 bg-sky-50/60 dark:border-slate-700 dark:bg-sky-500/5">
            <td colSpan={conteos.length + 2} className="px-3 py-1.5">
              <span className="font-semibold">{grupo.nombre}</span>
              {grupo.nota && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{grupo.nota}</span>}
            </td>
          </tr>
          <tr className="bg-slate-50 text-left text-brand-900 dark:bg-slate-800/60 dark:text-slate-200">
            <th className="sticky left-0 z-10 min-w-40 bg-slate-50 px-3 py-2 font-semibold dark:bg-slate-800">{etiqueta}</th>
            {conteos.map((c) => (
              <th key={c.clave} className="min-w-44 px-2 py-2 font-semibold">
                {c.etiqueta}
                <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">conteo · géneros</span>
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold whitespace-nowrap">
              Total
              <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">cel/ml × 1000</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {muestras.map((m, i) => {
            const total = CLAVES_FITOPLANCTON.reduce((t, c) => t + (aNumero(m.valores[c] ?? '') ?? 0), 0);
            const nombre = m.nombre || `la muestra ${i + 1}`;
            return (
              <tr key={i} className="border-t border-slate-100 align-top dark:border-slate-800">
                <th scope="row" className="sticky left-0 z-10 bg-white px-2 py-1.5 text-left font-normal dark:bg-slate-900">
                  <div className="flex items-center gap-1">
                    <input
                      value={m.nombre}
                      onChange={(e) => onRenombrar(i, e.target.value)}
                      maxLength={40}
                      placeholder={placeholder}
                      aria-label={`Nombre de la ${etiqueta.toLowerCase()} ${i + 1}`}
                      data-col="nombre"
                      className={`${CELDA} min-w-28 font-semibold`}
                    />
                    {muestras.length > 1 && (
                      <button type="button" onClick={() => onQuitar(i)} aria-label={`Quitar ${nombre}`} className={BOTON_QUITAR}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </th>
                {conteos.map((c) => {
                  const generos = campos.find((x) => x.junto === c.clave);
                  return (
                    <td key={c.clave} className="px-2 py-1.5">
                      <input
                        inputMode="decimal"
                        value={m.valores[c.clave] ?? ''}
                        data-col={c.clave}
                        onChange={(e) => onValor(i, c.clave, e.target.value)}
                        aria-label={`${c.etiqueta} de ${nombre}`}
                        className={`${CELDA} text-right tabular-nums`}
                      />
                      {generos?.opciones && (
                        <SelectorMultiple
                          opciones={generos.opciones}
                          valor={m.valores[generos.clave] ?? ''}
                          onCambiar={(v) => onValor(i, generos.clave, v)}
                          etiqueta={`${generos.etiqueta} de ${nombre}`}
                          className="mt-1 w-full"
                        />
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{total ? miles(total) : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface FilaAgregarParametroProps {
  columnas: number;
  /** Parámetros químicos que no están en este informe */
  disponibles: CampoLab[];
  onAgregar: (clave: string) => void;
  onCrear: (p: ParametroQuimico) => Promise<void>;
}

const NUEVO = '__nuevo';

/** Última fila del análisis químico: agregar un parámetro de la lista o crear uno nuevo */
function FilaAgregarParametro({ columnas, disponibles, onAgregar, onCrear }: FilaAgregarParametroProps) {
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', formula: '', unidad: 'mg/L', min: '', max: '' });
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const numero = (t: string) => {
    const s = t.trim().replace(',', '.');
    return s ? Number(s) : undefined;
  };

  async function crear() {
    const nombre = nuevo.nombre.trim();
    if (!nombre) {
      setError('Escriba el nombre del parámetro.');
      return;
    }
    const [min, max] = [numero(nuevo.min), numero(nuevo.max)];
    if ((min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max))) {
      setError('La referencia debe ser un número.');
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      await onCrear({ nombre, formula: nuevo.formula.trim(), unidad: nuevo.unidad.trim(), min, max });
      setCreando(false);
      setNuevo({ nombre: '', formula: '', unidad: 'mg/L', min: '', max: '' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <tr className="border-t border-slate-100 dark:border-slate-800 print:hidden">
      <td colSpan={columnas} className="px-3 py-2">
        {!creando ? (
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500">
            <Plus size={15} aria-hidden />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value === NUEVO) setCreando(true);
                else if (e.target.value) onAgregar(e.target.value);
              }}
              aria-label="Agregar un parámetro químico a este informe"
              className="rounded border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-brand-500 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Agregar parámetro…</option>
              {disponibles.map((c) => (
                <option key={c.clave} value={c.clave}>
                  {c.etiqueta}
                  {c.unidad ? ` (${c.unidad})` : ''}
                </option>
              ))}
              <option value={NUEVO}>Crear un parámetro nuevo…</option>
            </select>
          </label>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            {(
              [
                ['nombre', 'Parámetro', 'Ej. Sílice', 'w-40'],
                ['formula', 'Fórmula', 'Ej. SiO₂', 'w-24'],
                ['unidad', 'Unidad', '', 'w-20'],
                ['min', 'Ref. mín.', '', 'w-20'],
                ['max', 'Ref. máx.', '', 'w-20'],
              ] as const
            ).map(([k, rotulo, ph, ancho]) => (
              <label key={k} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {rotulo}
                <input
                  value={nuevo[k]}
                  onChange={(e) => setNuevo({ ...nuevo, [k]: e.target.value })}
                  placeholder={ph}
                  inputMode={k === 'min' || k === 'max' ? 'decimal' : undefined}
                  className={`${CELDA} ${ancho} mt-0.5 block min-w-0 font-normal`}
                />
              </label>
            ))}
            <button
              type="button"
              onClick={crear}
              disabled={ocupado}
              className="rounded-lg bg-brand-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 dark:bg-sky-600"
            >
              {ocupado ? 'Creando…' : 'Crear y agregar'}
            </button>
            <button type="button" onClick={() => setCreando(false)} className="px-2 py-1.5 text-sm font-semibold text-slate-500 hover:underline">
              Cancelar
            </button>
            <p className="w-full text-[11px] text-slate-500 dark:text-slate-400">
              Queda también en Configuración ▸ Parámetros del análisis químico, para usarlo en otros informes.
            </p>
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </td>
    </tr>
  );
}

interface FilaCampoProps {
  campo: CampoLab;
  /** Campo que va en la misma fila, a la derecha (ej. los géneros junto al conteo) */
  acompanante?: CampoLab;
  muestras: MuestraForm[];
  onValor: EditorMuestrasProps['onValor'];
  /** Si se indica, la fila lleva una ✕ para quitar el parámetro de este informe */
  onQuitar?: () => void;
}

function FilaCampo({ campo, acompanante, muestras, onValor, onQuitar }: FilaCampoProps) {
  const referencia = textoReferencia(campo);
  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-normal dark:bg-slate-900">
        <div className="flex items-start justify-between gap-2">
          <div>
            {campo.etiqueta}
            {campo.unidad && <span className="text-slate-500 dark:text-slate-400"> ({campo.unidad})</span>}
            {referencia && <span className="block text-[11px] text-slate-500 dark:text-slate-400">{referencia}</span>}
          </div>
          {onQuitar && (
            <button type="button" onClick={onQuitar} title="Quitar de este informe" aria-label={`Quitar ${campo.etiqueta} de este informe`} className={BOTON_QUITAR}>
              <X size={14} />
            </button>
          )}
        </div>
      </th>
      {muestras.map((m, i) => {
        const texto = m.valores[campo.clave] ?? '';
        const evaluacion = campo.tipo === 'numero' ? evaluarReferencia(campo, aNumero(texto), aNumero(m.valores.salinidad ?? '')) : null;
        return (
          <td key={i} className="px-2 py-1 align-top">
            <div className={acompanante ? 'flex items-start gap-1' : ''}>
              {campo.opciones ? (
                <SelectorMultiple
                  opciones={campo.opciones}
                  valor={texto}
                  onCambiar={(v) => onValor(i, campo.clave, v)}
                  etiqueta={`${campo.etiqueta} de ${m.nombre || `la muestra ${i + 1}`}`}
                />
              ) : campo.tipo === 'texto' ? (
                <textarea
                  rows={2}
                  value={texto}
                  data-col={i}
                  onChange={(e) => onValor(i, campo.clave, e.target.value)}
                  maxLength={500}
                  className={`${CELDA} resize-y`}
                />
              ) : (
                <input
                  inputMode="decimal"
                  value={texto}
                  data-col={i}
                  onChange={(e) => onValor(i, campo.clave, e.target.value)}
                  className={`${acompanante ? CELDA_CORTA : CELDA} text-right tabular-nums`}
                />
              )}
              {acompanante?.opciones && (
                <SelectorMultiple
                  opciones={acompanante.opciones}
                  valor={m.valores[acompanante.clave] ?? ''}
                  onCambiar={(v) => onValor(i, acompanante.clave, v)}
                  etiqueta={`${acompanante.etiqueta} de ${m.nombre || `la muestra ${i + 1}`}`}
                  className="min-w-44 flex-1"
                />
              )}
            </div>
            {evaluacion?.tipo === 'nivel' && (
              <span className={`block text-[11px] font-semibold ${NIVELES_PATOLOGIA[evaluacion.nivel].clase}`}>{NIVELES_PATOLOGIA[evaluacion.nivel].label}</span>
            )}
            {evaluacion?.tipo === 'referencia' && (
              <span
                className={`block text-[11px] ${evaluacion.estado ? `font-semibold ${ESTADOS_REFERENCIA[evaluacion.estado].clase}` : 'text-slate-500 dark:text-slate-400'}`}
              >
                {evaluacion.texto}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
