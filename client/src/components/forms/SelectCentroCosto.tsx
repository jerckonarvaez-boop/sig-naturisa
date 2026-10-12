import { CLASE_CONTROL } from './Campo';
import { SelectLista } from './SelectLista';

interface SelectCentroCostoProps {
  value: string;
  onChange: (valor: string) => void;
  /** Centros de costo válidos (los del presupuesto) */
  opciones: string[];
  required?: boolean;
}

/**
 * Lista validada de sucursales / centros de costo definidos en el presupuesto.
 * Si aún no hay presupuesto importado, permite escribirlo para no bloquear el formulario.
 */
export function SelectCentroCosto({ value, onChange, opciones, required }: SelectCentroCostoProps) {
  if (!opciones.length) {
    return (
      <input
        required={required}
        maxLength={120}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Importe el presupuesto para ver la lista"
        className={CLASE_CONTROL}
      />
    );
  }
  return <SelectLista value={value} onChange={onChange} opciones={opciones} required={required} />;
}
