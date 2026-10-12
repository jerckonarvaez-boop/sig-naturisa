import { CLASE_CONTROL } from './Campo';

interface SelectListaProps {
  value: string;
  onChange: (valor: string) => void;
  /** Valores permitidos */
  opciones: string[];
  required?: boolean;
  /** Texto de la opción vacía */
  vacio?: string;
}

/**
 * Lista validada: solo se puede elegir uno de los valores permitidos. Si un registro antiguo tiene un
 * valor que ya no está en la lista, se conserva y se marca para no perderlo al editar.
 */
export function SelectLista({ value, onChange, opciones, required, vacio }: SelectListaProps) {
  const fueraDeLista = value && !opciones.includes(value);
  return (
    <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className={CLASE_CONTROL}>
      <option value="">{vacio ?? (required ? 'Seleccione…' : '— Ninguno —')}</option>
      {fueraDeLista && <option value={value}>{value} (ya no está en la lista)</option>}
      {opciones.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
