import type { Importacion } from '../types';

/** Fecha y archivo de la última importación (en ámbar si tiene más de una semana) */
export function EstadoDatos({ importacion }: { importacion: Importacion | null }) {
  if (!importacion) return null;
  const fecha = new Date(importacion.importadoEn);
  const dias = (Date.now() - fecha.getTime()) / 864e5;
  const texto = `${fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}, ${fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}`;
  return (
    <p className="-mt-3 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${dias > 8 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
        Datos importados el {texto}
        {dias > 8 && ' (hace más de una semana)'}
      </span>
      <span>Fuente: {importacion.archivo}</span>
    </p>
  );
}
