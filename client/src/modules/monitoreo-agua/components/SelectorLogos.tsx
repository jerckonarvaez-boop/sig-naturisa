import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Trash2 } from 'lucide-react';
import { eliminarLogo, listarLogos, subirLogo, urlLogo } from '../services/monitoreo.api';
import type { Logo } from '../types';

interface SelectorLogosProps {
  elegidos: number[];
  onCambiar: (ids: number[]) => void;
}

const MAX_LOGO = 1024 * 1024;

/**
 * Logos para el encabezado del informe: se marcan hasta dos (ej. Naturisa + LarviQuest). Se pueden subir logos nuevos
 * (PNG, JPG o WEBP) y borrar los que ninguna camaronera usa.
 */
export function SelectorLogos({ elegidos, onCambiar }: SelectorLogosProps) {
  const [logos, setLogos] = useState<Logo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listarLogos()
      .then(setLogos)
      .catch((e: Error) => setError(e.message));
  }, []);

  const alternar = (id: number) => {
    setError(null);
    if (elegidos.includes(id)) onCambiar(elegidos.filter((x) => x !== id));
    else if (elegidos.length >= 2) setError('Máximo dos logos por informe.');
    else onCambiar([...elegidos, id]);
  };

  async function subir(f: File | undefined) {
    if (archivo.current) archivo.current.value = '';
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return setError('El logo debe ser PNG, JPG o WEBP.');
    if (f.size > MAX_LOGO) return setError('El logo pesa más de 1 MB.');
    setSubiendo(true);
    setError(null);
    try {
      const nuevo = await subirLogo(f);
      setLogos((l) => [...(l ?? []), nuevo]);
      if (elegidos.length < 2) onCambiar([...elegidos, nuevo.id]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubiendo(false);
    }
  }

  async function borrar(l: Logo) {
    if (!window.confirm(`¿Borrar el logo "${l.nombre}"?`)) return;
    try {
      await eliminarLogo(l.id);
      setLogos((ls) => ls?.filter((x) => x.id !== l.id) ?? ls);
      onCambiar(elegidos.filter((x) => x !== l.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Logos del encabezado">
        {logos?.map((l) => {
          const activo = elegidos.includes(l.id);
          const orden = elegidos.indexOf(l.id) + 1;
          return (
            <div key={l.id} className="relative">
              <button
                type="button"
                role="checkbox"
                aria-checked={activo}
                aria-label={l.nombre}
                title={l.nombre}
                onClick={() => alternar(l.id)}
                className={`flex h-16 w-28 items-center justify-center rounded-lg border-2 bg-white p-1.5 ${
                  activo ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-slate-200 hover:border-brand-500 dark:border-slate-700'
                }`}
              >
                <img src={urlLogo(l.id)} alt="" className="max-h-full max-w-full object-contain" />
              </button>
              {activo && (
                <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                  {elegidos.length > 1 ? orden : <Check size={12} strokeWidth={3} />}
                </span>
              )}
              {!activo && (
                <button
                  type="button"
                  onClick={() => borrar(l)}
                  aria-label={`Borrar ${l.nombre}`}
                  title="Borrar logo"
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-white p-0.5 text-slate-400 shadow hover:text-red-600 dark:bg-slate-800"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => archivo.current?.click()}
          disabled={subiendo}
          className="flex h-16 w-28 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-brand-500 hover:text-brand-500 dark:border-slate-600"
        >
          <ImagePlus size={18} /> {subiendo ? 'Subiendo…' : 'Subir logo'}
        </button>
        <input ref={archivo} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => subir(e.target.files?.[0])} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
        Marque hasta dos (salen uno sobre otro en el orden marcado). Sin logo, se usa el texto de abajo o el logo de Naturisa.
      </p>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
