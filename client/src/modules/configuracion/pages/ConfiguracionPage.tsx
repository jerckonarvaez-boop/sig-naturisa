import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { olvidarDefinicion } from '@/modules/laboratorios/analisis/hooks/useDefinicion';
import { guardarLista, obtenerListas, restaurarLista, type ListaEditable } from '@/services/api/listas';
import { EditorLista } from '../components/EditorLista';
import { meta } from '../meta';

/** Configuración: listas de valores que usan los formularios (géneros, clientes, partes…), editables sin programar. */
export function ConfiguracionPage() {
  const [listas, setListas] = useState<ListaEditable[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerListas()
      .then(setListas)
      .catch((e) => setError((e as Error).message));
  }, []);

  /** Listas agrupadas por la sección donde se usan, en el orden en que llegan */
  const secciones = useMemo(() => {
    const grupos = new Map<string, ListaEditable[]>();
    for (const l of listas ?? []) grupos.set(l.seccion, [...(grupos.get(l.seccion) ?? []), l]);
    return [...grupos];
  }, [listas]);

  const actualizar = (id: string, valores: string[], editada: boolean) => {
    setListas((ls) => ls?.map((l) => (l.id === id ? { ...l, valores, editada } : l)) ?? ls);
    // Los formularios de laboratorio vuelven a pedir la definición con las listas nuevas
    olvidarDefinicion();
  };

  return (
    <>
      <PageHeader title={meta.label} subtitle={meta.description} />
      {error && <p className="text-sm text-red-600">No se pudo cargar la configuración: {error}</p>}
      {!listas && !error && <p className="text-sm text-slate-500">Cargando…</p>}

      {secciones.map(([seccion, ls]) => (
        <section key={seccion} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{seccion}</h2>
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ls.map((l) => (
              <EditorLista
                key={l.id}
                lista={l}
                onGuardar={async (valores) => {
                  const r = await guardarLista(l.id, valores);
                  actualizar(l.id, r.valores, true);
                }}
                onRestaurar={async () => {
                  await restaurarLista(l.id);
                  actualizar(l.id, l.inicial, false);
                }}
              />
            ))}
          </div>
        </section>
      ))}

      {listas && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Los cambios se guardan al momento y se ven al abrir de nuevo el formulario. Quitar un valor no cambia los registros que ya lo
          tienen.
        </p>
      )}
    </>
  );
}
