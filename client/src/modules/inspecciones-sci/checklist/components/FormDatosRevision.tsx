import { Campo, CLASE_CONTROL } from '@/components/forms/Campo';
import { SelectCentroCosto } from '@/components/forms/SelectCentroCosto';
import { Card } from '@/components/ui/Card';
import { useLista } from '@/hooks/useLista';
import type { DatosRevision } from '../hooks/useRevisionForm';

interface FormDatosRevisionProps {
  datos: DatosRevision;
  onCambiar: (cambio: Partial<DatosRevision>) => void;
}

/** Encabezado del check list: fecha, sucursal, responsable y observaciones generales. */
export function FormDatosRevision({ datos, onCambiar }: FormDatosRevisionProps) {
  // Sucursales: lista editable en Configuración ▸ Centros de costo de Inspecciones SCI
  const centros = useLista('inspecciones.centros');
  return (
    <Card compact title="Datos de la revisión">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Fecha *">
          <input type="date" required value={datos.fecha} onChange={(e) => onCambiar({ fecha: e.target.value })} className={CLASE_CONTROL} />
        </Campo>
        <Campo etiqueta="Sucursal / centro de costo *">
          <SelectCentroCosto
            required
            value={datos.sucursal}
            onChange={(v) => onCambiar({ sucursal: v })}
            opciones={centros.valores}
            sinLista={centros.cargado ? 'Agregue centros de costo en Configuración' : 'Cargando…'}
          />
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
