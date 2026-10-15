import { useState, type FormEvent } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import { CLASE_CONTROL } from '@/components/forms/Campo';
import { Card } from '@/components/ui/Card';
import type { ListaEditable } from '@/services/api/listas';

interface EditorListaProps {
  lista: ListaEditable;
  /** Guarda los valores (lanza un error con el mensaje si no son válidos) */
  onGuardar: (valores: string[]) => Promise<void>;
  onRestaurar: () => Promise<void>;
}

/** Una lista editable: sus valores como etiquetas que se quitan con ✕ y un campo para agregar. Se guarda al momento. */
export function EditorLista({ lista, onGuardar, onRestaurar }: EditorListaProps) {
  const [nuevo, setNuevo] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error?: boolean } | null>(null);

  async function guardar(valores: string[], ok: string) {
    setOcupado(true);
    setMensaje(null);
    try {
      await onGuardar(valores);
      setMensaje({ texto: ok });
      return true;
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  async function agregar(e: FormEvent) {
    e.preventDefault();
    const t = nuevo.trim();
    if (!t) return;
    if (await guardar([...lista.valores, t], `"${t}" agregado.`)) setNuevo('');
  }

  const quitar = (v: string) => {
    if (lista.valores.length === 1) {
      setMensaje({ texto: 'La lista debe tener al menos un valor.', error: true });
      return;
    }
    if (!window.confirm(`¿Quitar "${v}" de la lista? Los registros que ya lo tienen no cambian.`)) return;
    guardar(
      lista.valores.filter((x) => x !== v),
      `"${v}" quitado.`,
    );
  };

  async function restaurar() {
    if (!window.confirm(`¿Volver a los valores de fábrica de "${lista.nombre}"? (${lista.inicial.join(', ')})`)) return;
    setOcupado(true);
    setMensaje(null);
    try {
      await onRestaurar();
      setMensaje({ texto: 'Lista restaurada.' });
    } catch (e) {
      setMensaje({ texto: (e as Error).message, error: true });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Card
      compact
      title={lista.nombre}
      subtitle={lista.descripcion}
      actions={
        lista.editada && (
          <button
            type="button"
            onClick={restaurar}
            disabled={ocupado}
            title="Volver a los valores de fábrica"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-500 hover:underline"
          >
            <RotateCcw size={13} /> Restaurar
          </button>
        )
      }
    >
      <ul className="mb-3 flex flex-wrap gap-1.5" aria-label={`Valores de ${lista.nombre}`}>
        {lista.valores.map((v) => (
          <li
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pr-1 pl-3 text-sm dark:bg-slate-800"
          >
            {v}
            <button
              type="button"
              onClick={() => quitar(v)}
              disabled={ocupado}
              aria-label={`Quitar ${v}`}
              className="rounded-full p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
            >
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={agregar} className="flex gap-2">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          maxLength={80}
          placeholder={lista.sinEspacios ? 'Nuevo género' : 'Nuevo valor'}
          aria-label={`Agregar a ${lista.nombre}`}
          className={`${CLASE_CONTROL} min-w-0 flex-1`}
        />
        <button
          type="submit"
          disabled={ocupado || !nuevo.trim()}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50 dark:bg-sky-600"
        >
          <Plus size={15} /> Agregar
        </button>
      </form>

      {mensaje && (
        <p role="status" className={`mt-2 text-xs ${mensaje.error ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-300'}`}>
          {mensaje.texto}
        </p>
      )}
    </Card>
  );
}
