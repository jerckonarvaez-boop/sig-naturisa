import { RotateCcw, Save, X } from 'lucide-react';
import { BOTON_PRIMARIO } from '@/components/ui/botones';
import { Card } from '@/components/ui/Card';
import { CLASE_CONTROL } from '@/components/forms/Campo';
import { CAMPOS_EDITABLES } from '../../logic/informe';
import type { CampoEdicion, EdicionInforme } from '../../types';

interface EditorTextosInformeProps {
  /** Textos que tendría el informe sin correcciones (los de la ficha o automáticos) */
  automaticos: Record<CampoEdicion, string>;
  edicion: EdicionInforme;
  onCambiar: (edicion: EdicionInforme) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  guardando: boolean;
}

/**
 * Corrige a mano los textos de este informe; el documento de al lado se actualiza mientras se escribe.
 * Lo guardado sale igual en la vista, el PDF y el Word. Solo se guarda lo que difiere del texto automático.
 */
export function EditorTextosInforme({ automaticos, edicion, onCambiar, onGuardar, onCancelar, guardando }: EditorTextosInformeProps) {
  const cambiar = (campo: CampoEdicion, valor: string) => {
    const nueva = { ...edicion };
    if (valor.trim() && valor.trim() !== automaticos[campo]) nueva[campo] = valor;
    else delete nueva[campo];
    onCambiar(nueva);
  };

  return (
    <Card compact title="Editar textos del informe" subtitle="Los cambios valen solo para este informe; la ficha técnica no cambia.">
      <div className="flex flex-col gap-3">
        {CAMPOS_EDITABLES.map(({ campo, etiqueta }) => {
          const corregido = edicion[campo] !== undefined;
          return (
            <label key={campo} className="block">
              <span className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>
                  {etiqueta}
                  {corregido && <span className="ml-1.5 font-normal text-amber-700 dark:text-amber-300">· corregido</span>}
                </span>
                {corregido && (
                  <button
                    type="button"
                    onClick={() => cambiar(campo, '')}
                    className="inline-flex items-center gap-1 font-normal text-brand-500 hover:underline"
                    title="Volver al texto automático"
                  >
                    <RotateCcw size={12} /> Automático
                  </button>
                )}
              </span>
              <textarea
                value={edicion[campo] ?? automaticos[campo]}
                onChange={(e) => cambiar(campo, e.target.value)}
                rows={campo === 'tabla' || campo === 'anexo' ? 2 : 4}
                maxLength={5000}
                className={CLASE_CONTROL}
              />
            </label>
          );
        })}
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={15} /> Cancelar
          </button>
          <button type="button" onClick={onGuardar} disabled={guardando} className={`${BOTON_PRIMARIO} inline-flex items-center gap-2 py-2`}>
            <Save size={15} /> {guardando ? 'Guardando…' : 'Guardar textos'}
          </button>
        </div>
      </div>
    </Card>
  );
}
