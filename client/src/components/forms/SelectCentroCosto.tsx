import { CLASE_CONTROL } from './Campo';
import { SelectLista } from './SelectLista';

interface SelectCentroCostoProps {
  value: string;
  onChange: (valor: string) => void;
  /** Centros de costo válidos */
  opciones: string[];
  required?: boolean;
  /** Texto del campo libre cuando la lista está vacía */
  sinLista?: string;
}

/**
 * Lista validada de sucursales / centros de costo (del presupuesto o de una lista de Configuración).
 * Si la lista está vacía, permite escribirlo para no bloquear el formulario.
 */
export function SelectCentroCosto({ value, onChange, opciones, required, sinLista = 'Importe el presupuesto para ver la lista' }: SelectCentroCostoProps) {
  if (!opciones.length) {
    return (
      <input
        required={required}
        maxLength={120}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={sinLista}
        className={CLASE_CONTROL}
      />
    );
  }
  return <SelectLista value={value} onChange={onChange} opciones={opciones} required={required} />;
}
