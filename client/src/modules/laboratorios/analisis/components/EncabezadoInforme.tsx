import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { SelectCentroCosto } from '@/components/forms/SelectCentroCosto';
import { Card } from '@/components/ui/Card';
import type { InformeForm } from '../hooks/useInformeForm';
import { alternarTipo, partesDelTipo, tipoUnaMuestra } from '../logic/laboratorio';
import type { SeccionLab } from '../types';

interface EncabezadoInformeProps {
  seccion: SeccionLab;
  form: InformeForm;
  /** Centros de costo del presupuesto + clientes del laboratorio */
  identificaciones: string[];
  onCambiar: <K extends keyof Omit<InformeForm, 'muestras'>>(campo: K, valor: InformeForm[K]) => void;
}

/** Datos generales del informe: tipo, código, fechas, identificación de la muestra, matriz… */
export function EncabezadoInforme({ seccion, form, identificaciones, onCambiar }: EncabezadoInformeProps) {
  const unaMuestra = tipoUnaMuestra(seccion, form.tipo);
  return (
    <Card compact title="Datos del informe">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {seccion.combinable ? (
          <AnalisisCombinables seccion={seccion} tipo={form.tipo} onCambiar={(tipo) => onCambiar('tipo', tipo)} />
        ) : (
          <Campo etiqueta="Tipo de informe *" className="sm:col-span-2">
            <select value={form.tipo} onChange={(e) => onCambiar('tipo', e.target.value)} className={CLASE_CONTROL}>
              {seccion.tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
            {unaMuestra && form.muestras.length > 1 && (
              <span className="mt-1 block text-xs font-semibold text-red-600 dark:text-red-400">Este tipo lleva una sola muestra.</span>
            )}
          </Campo>
        )}
        <Campo etiqueta="Código *">
          <input required maxLength={80} value={form.codigo} onChange={(e) => onCambiar('codigo', e.target.value)} className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Fecha de emisión *">
          <input type="date" required value={form.fechaEmision} onChange={(e) => onCambiar('fechaEmision', e.target.value)} className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Identificación (centro de costo / cliente) *" className="sm:col-span-2">
          <SelectCentroCosto required value={form.sucursal} onChange={(v) => onCambiar('sucursal', v)} opciones={identificaciones} />
        </Campo>
        <Campo etiqueta={seccion.etiquetaFechaMuestra}>
          <input type="date" value={form.fechaMuestra} onChange={(e) => onCambiar('fechaMuestra', e.target.value)} className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Matriz de la muestra">
          <input list={`matrices-${seccion.id}`} maxLength={120} value={form.matriz} onChange={(e) => onCambiar('matriz', e.target.value)} className={CLASE_CONTROL} />
          <datalist id={`matrices-${seccion.id}`}>
            {seccion.matrices.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Muestreado por" className="sm:col-span-2">
          <input maxLength={120} value={form.muestreadoPor} onChange={(e) => onCambiar('muestreadoPor', e.target.value)} placeholder="Ej. Personal del campamento" className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Técnico de laboratorio" className="sm:col-span-2">
          <input maxLength={120} value={form.tecnico} onChange={(e) => onCambiar('tecnico', e.target.value)} className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Observaciones" className="sm:col-span-2 lg:col-span-4">
          <textarea rows={2} maxLength={4000} value={form.observaciones} onChange={(e) => onCambiar('observaciones', e.target.value)} className={CLASE_CONTROL} />
        </Campo>
      </div>
    </Card>
  );
}

/** Análisis que lleva el informe (una, dos o las tres tablas); siempre queda al menos uno marcado */
function AnalisisCombinables({ seccion, tipo, onCambiar }: { seccion: SeccionLab; tipo: string; onCambiar: (tipo: string) => void }) {
  const partes = partesDelTipo(tipo);
  return (
    <fieldset className="sm:col-span-2 lg:col-span-4">
      <legend className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Tipo de informe * (marque una, dos o las tres tablas)</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {seccion.tipos.map((t) => {
          const marcado = partes.includes(t.id);
          const ultimo = marcado && partes.length === 1;
          return (
            <label key={t.id} title={ultimo ? 'El informe debe llevar al menos un análisis' : undefined} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={marcado}
                disabled={ultimo}
                onChange={() => onCambiar(alternarTipo(seccion, tipo, t.id))}
                className="size-4 accent-brand-500"
              />
              {t.nombre}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
