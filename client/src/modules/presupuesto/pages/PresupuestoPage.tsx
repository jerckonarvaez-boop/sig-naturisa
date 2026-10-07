import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { TooltipLayer } from '@/components/charts/Tooltip';
import { ImportarExcel } from '../components/ImportarExcel';
import { SinDatos } from '../components/SinDatos';
import { Tablero } from '../components/Tablero';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { meta } from '../meta';

/** Presupuesto vs. gasto: importación del Excel y tablero. */
export function PresupuestoPage() {
  const { data, cargando, error, recargar } = usePresupuesto();
  const [aviso, setAviso] = useState<{ texto: string; error?: boolean } | null>(null);

  const importador = (
    <ImportarExcel
      onImportado={(texto) => {
        setAviso({ texto });
        recargar();
      }}
      onError={(texto) => setAviso({ texto, error: true })}
    />
  );

  return (
    <>
      <PageHeader title={meta.label} subtitle="Ambiente, Calidad y Laboratorios" actions={importador} />
      {aviso && (
        <p
          role="status"
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            aviso.error
              ? 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
          }`}
        >
          {aviso.texto}
        </p>
      )}

      {error ? (
        <Card className="py-12 text-center text-red-600">No se pudieron cargar los datos: {error}</Card>
      ) : !data ? (
        cargando && <Card className="py-12 text-center text-slate-500">Cargando presupuesto…</Card>
      ) : !data.gastos.length ? (
        <SinDatos />
      ) : (
        <TooltipLayer>
          <Tablero data={data} />
        </TooltipLayer>
      )}
    </>
  );
}
