import { FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/** Estado vacío: aún no se ha importado el Excel */
export function SinDatos() {
  return (
    <Card className="flex flex-col items-center py-16 text-center">
      <FileSpreadsheet size={40} className="text-brand-500" />
      <p className="mt-4 text-lg font-semibold">Aún no hay datos de presupuesto</p>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Pulse <b>Importar Excel</b> y elija el archivo <i>Control de presupuesto SIG</i>. Debe tener las tablas
        Consulta2, PresupuestoTipo y PresuestoArea.
      </p>
    </Card>
  );
}
