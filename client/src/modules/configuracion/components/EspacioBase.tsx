import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { obtenerAlmacenamiento, type Almacenamiento } from '@/services/api/almacenamiento';

const MB = 1024 * 1024;
const numero = (n: number, decimales = 1) => n.toLocaleString('es-EC', { maximumFractionDigits: decimales });

/** "54,1 MB" · "5 GB" · "180 KB" */
function tamano(bytes: number): string {
  if (bytes >= 1024 * MB) return `${numero(bytes / 1024 / MB)} GB`;
  if (bytes >= MB) return `${numero(bytes / MB)} MB`;
  return `${numero(bytes / 1024, 0)} KB`;
}

/** Barra horizontal; el color avisa cuando la base se acerca al límite */
function Barra({ valor, max, etiqueta, alerta = false }: { valor: number; max: number; etiqueta: string; alerta?: boolean }) {
  const pct = max ? Math.min(100, (valor / max) * 100) : 0;
  const color = !alerta ? 'bg-brand-500' : pct >= 90 ? 'bg-red-600' : pct >= 75 ? 'bg-amber-500' : 'bg-brand-500';
  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
    >
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, valor > 0 ? 1 : 0)}%` }} />
    </div>
  );
}

/**
 * Espacio de la base de datos: lo usado frente al límite del plan, cuánto ocupa cada módulo y los archivos
 * (PDF, logos, fotos) que se guardan dentro de la base.
 */
export function EspacioBase() {
  const [datos, setDatos] = useState<Almacenamiento | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerAlmacenamiento()
      .then(setDatos)
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="mb-6 text-sm text-red-600">No se pudo leer el espacio de la base de datos: {error}</p>;
  if (!datos) return <p className="mb-6 text-sm text-slate-500">Calculando el espacio de la base de datos…</p>;

  const pct = datos.limite ? (datos.usado / datos.limite) * 100 : 0;
  const libre = Math.max(0, datos.limite - datos.usado);
  const pdf = datos.archivos.find((a) => a.tipo === 'PDF de laboratorio');
  const promedioPdf = pdf?.cantidad ? pdf.bytes / pdf.cantidad : 0;
  const enArchivos = datos.archivos.reduce((s, a) => s + a.bytes, 0);
  const cantidadArchivos = datos.archivos.reduce((s, a) => s + a.cantidad, 0);
  const mayorModulo = Math.max(...datos.modulos.map((m) => m.bytes), 1);

  return (
    <Card className="mb-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Database size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Espacio de la base de datos</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {datos.base === 'turso'
              ? `Base de datos en Turso (plan gratis: ${tamano(datos.limite)}). Los PDF, logos y fotos se guardan dentro de la base: no se pierden al publicar.`
              : `Base de datos local del borrador (server/data/sig.db, en este PC). La web publicada usa Turso (plan gratis: ${tamano(datos.limite)}).`}
          </p>
        </div>
      </div>

      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-sm">
          <b className="text-base">{tamano(datos.usado)}</b> de {tamano(datos.limite)}
        </p>
        <p className={`text-base font-semibold tabular-nums ${pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-amber-600' : ''}`}>
          {numero(pct)} %
        </p>
      </div>
      <Barra valor={datos.usado} max={datos.limite} etiqueta="Espacio usado de la base de datos" alerta />
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {promedioPdf > 0 && (
          <>
            Caben aún unos <b>{numero(Math.floor(libre / promedioPdf), 0)}</b> PDF de laboratorio (~{tamano(promedioPdf)} cada uno, según
            el promedio actual).{' '}
          </>
        )}
        Archivos dentro de la base: {tamano(enArchivos)} en {numero(cantidadArchivos, 0)} {cantidadArchivos === 1 ? 'archivo' : 'archivos'}.
        {pct >= 75 && <b className="text-amber-700 dark:text-amber-300"> La base se está llenando: conviene revisar el plan.</b>}
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="mb-2 text-sm font-semibold">Espacio por módulo</h3>
          <ul className="flex flex-col gap-2">
            {datos.modulos.map((m) => (
              <li key={m.modulo} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_4.5rem] items-center gap-3 text-sm">
                <span className="truncate">{m.modulo}</span>
                <Barra valor={m.bytes} max={mayorModulo} etiqueta={`Espacio de ${m.modulo}`} />
                <span className="text-right font-semibold tabular-nums">{tamano(m.bytes)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-semibold">Archivos guardados</h3>
          <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
            {datos.archivos.map((a) => (
              <li key={a.tipo} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                <span>
                  {a.tipo} <span className="text-xs text-slate-500 dark:text-slate-400">· {a.modulo}</span>
                </span>
                <span className="text-right whitespace-nowrap tabular-nums">
                  {numero(a.cantidad, 0)} {a.cantidad === 1 ? 'archivo' : 'archivos'} · <b>{tamano(a.bytes)}</b>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Card>
  );
}
