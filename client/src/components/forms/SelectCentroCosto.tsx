import { CLASE_CONTROL } from './Campo';

interface SelectCentroCostoProps {
  value: string;
  onChange: (valor: string) => void;
  /** Centros de costo válidos (los del presupuesto) */
  opciones: string[];
  required?: boolean;
}

/**
 * Lista validada de sucursales / centros de costo: solo se puede elegir uno de los definidos en el
 * presupuesto. Si un registro antiguo tiene un valor que ya no está en la lista, se conserva y se marca.
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

  const fueraDeLista = value && !opciones.includes(value);
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={CLASE_CONTROL}>
      <option value="">{required ? 'Seleccione…' : '— Ninguno —'}</option>
      {fueraDeLista && <option value={value}>{value} (no está en el presupuesto)</option>}
      {opciones.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
