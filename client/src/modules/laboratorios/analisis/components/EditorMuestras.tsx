import { Fragment } from 'react';
import { Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { miles } from '@/utils/numeros';
import type { MuestraForm } from '../hooks/useInformeForm';
import {
  aNumero,
  camposDelTipo,
  CLAVES_FITOPLANCTON,
  ESTADOS_REFERENCIA,
  evaluarReferencia,
  gruposDelTipo,
  NIVELES_PATOLOGIA,
  textoReferencia,
  tipoUnaMuestra,
} from '../logic/laboratorio';
import type { CampoLab, SeccionLab } from '../types';

interface EditorMuestrasProps {
  seccion: SeccionLab;
  tipo: string;
  muestras: MuestraForm[];
  onAgregar: () => void;
  onQuitar: (i: number) => void;
  onRenombrar: (i: number, nombre: string) => void;
  onValor: (i: number, clave: string, valor: string) => void;
}

const CELDA = 'w-full min-w-24 rounded border border-slate-300 bg-white px-2 py-1 text-[13px] focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950';

/** Resultados en el formato del informe: parámetros en filas y una columna por muestra. */
export function EditorMuestras({ seccion, tipo, muestras, onAgregar, onQuitar, onRenombrar, onValor }: EditorMuestrasProps) {
  const campos = camposDelTipo(seccion, tipo);
  const grupos = gruposDelTipo(seccion, tipo);
  const unaMuestra = tipoUnaMuestra(seccion, tipo);
  const columnas = muestras.length + 1;

  return (
    <Card compact title="Resultados" subtitle="Deje vacío (o escriba -) lo que no se analizó">
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-slate-50 text-left text-brand-900 dark:bg-slate-800/60 dark:text-slate-200">
              <th className="sticky left-0 z-10 min-w-52 bg-slate-50 px-3 py-2 font-semibold dark:bg-slate-800">{seccion.etiquetaMuestra}</th>
              {muestras.map((m, i) => (
                <th key={i} className="px-2 py-2 align-top font-semibold">
                  <div className="flex items-center gap-1">
                    <input
                      value={m.nombre}
                      onChange={(e) => onRenombrar(i, e.target.value)}
                      maxLength={40}
                      placeholder={seccion.id === 'suelo' ? 'Ej. 99' : 'Ej. PS-79'}
                      aria-label={`Nombre de la ${seccion.etiquetaMuestra.toLowerCase()} ${i + 1}`}
                      className={`${CELDA} font-semibold`}
                    />
                    {muestras.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onQuitar(i)}
                        aria-label={`Quitar ${m.nombre || `la columna ${i + 1}`}`}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 print:hidden"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <Fragment key={g.id}>
                <tr className="border-t border-slate-200 bg-sky-50/60 dark:border-slate-700 dark:bg-sky-500/5">
                  <td colSpan={columnas} className="px-3 py-1.5">
                    <span className="font-semibold">{g.nombre}</span>
                    {g.nota && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{g.nota}</span>}
                  </td>
                </tr>
                {campos
                  .filter((c) => c.grupo === g.id)
                  .map((c) => (
                    <FilaCampo key={c.clave} campo={c} muestras={muestras} onValor={onValor} />
                  ))}
                {g.id === 'fitoplancton' && <FilaTotalFitoplancton muestras={muestras} />}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {!unaMuestra && (
        <button type="button" onClick={onAgregar} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline print:hidden">
          <Plus size={15} /> Agregar {seccion.etiquetaMuestra.toLowerCase()}
        </button>
      )}
    </Card>
  );
}

function FilaCampo({ campo, muestras, onValor }: { campo: CampoLab; muestras: MuestraForm[]; onValor: EditorMuestrasProps['onValor'] }) {
  const referencia = textoReferencia(campo);
  return (
    <tr className="border-t border-slate-100 dark:border-slate-800">
      <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-1.5 text-left font-normal dark:bg-slate-900">
        {campo.etiqueta}
        {campo.unidad && <span className="text-slate-500 dark:text-slate-400"> ({campo.unidad})</span>}
        {referencia && <span className="block text-[11px] text-slate-500 dark:text-slate-400">{referencia}</span>}
      </th>
      {muestras.map((m, i) => {
        const texto = m.valores[campo.clave] ?? '';
        const evaluacion = campo.tipo === 'numero' ? evaluarReferencia(campo, aNumero(texto), aNumero(m.valores.salinidad ?? '')) : null;
        return (
          <td key={i} className="px-2 py-1 align-top">
            {campo.tipo === 'texto' ? (
              <textarea rows={2} value={texto} onChange={(e) => onValor(i, campo.clave, e.target.value)} maxLength={500} className={`${CELDA} resize-y`} />
            ) : (
              <input inputMode="decimal" value={texto} onChange={(e) => onValor(i, campo.clave, e.target.value)} className={`${CELDA} text-right tabular-nums`} />
            )}
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

/** Total de células (suma de los grupos de fitoplancton), calculado */
function FilaTotalFitoplancton({ muestras }: { muestras: MuestraForm[] }) {
  return (
    <tr className="border-t border-slate-100 bg-slate-50/60 font-semibold dark:border-slate-800 dark:bg-slate-800/30">
      <th scope="row" className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 text-left dark:bg-slate-800">
        Total <span className="font-normal text-slate-500 dark:text-slate-400">(cel/ml × 1000)</span>
      </th>
      {muestras.map((m, i) => {
        const total = CLAVES_FITOPLANCTON.reduce((t, c) => t + (aNumero(m.valores[c] ?? '') ?? 0), 0);
        return (
          <td key={i} className="px-3 py-1.5 text-right tabular-nums">
            {total ? miles(total) : '—'}
          </td>
        );
      })}
    </tr>
  );
}
