import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { Card } from '@/components/ui/Card';
import type { DatosRevision } from '../hooks/useRevisionForm';

interface FormDatosRevisionProps {
  datos: DatosRevision;
  onCambiar: (cambio: Partial<DatosRevision>) => void;
  /** Sucursales ya usadas, como sugerencias */
  sucursales: string[];
}

/** Encabezado del check list: fecha, sucursal, responsable y observaciones generales. */
export function FormDatosRevision({ datos, onCambiar, sucursales }: FormDatosRevisionProps) {
  return (
    <Card compact title="Datos de la revisión">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Fecha *">
          <input type="date" required value={datos.fecha} onChange={(e) => onCambiar({ fecha: e.target.value })} className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Sucursal / finca *">
          <input
            list="sucursales-checklist"
            required
            maxLength={120}
            value={datos.sucursal}
            onChange={(e) => onCambiar({ sucursal: e.target.value })}
            placeholder="Ej. Fincacua"
            className={CLASE_CONTROL}
          />
          <datalist id="sucursales-checklist">
            {sucursales.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </Campo>
        <Campo etiqueta="Responsable">
          <input maxLength={120} value={datos.responsable} onChange={(e) => onCambiar({ responsable: e.target.value })} className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Observaciones generales" className="sm:col-span-3">
          <textarea
            rows={2}
            maxLength={4000}
            value={datos.observaciones}
            onChange={(e) => onCambiar({ observaciones: e.target.value })}
            className={CLASE_CONTROL}
          />
        </Campo>
      </div>
    </Card>
  );
}
