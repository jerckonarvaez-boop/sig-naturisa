// Formatos numéricos del presupuesto: punto para miles y coma para decimales ($12.860,50)

export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function miles(n: number, decimales = 0): string {
  const [entero, dec] = Math.abs(n).toFixed(decimales).split('.');
  const conPuntos = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 ? '-' : '') + conPuntos + (dec ? `,${dec}` : '');
}

/** $12.860 o $12.860,50 */
export const dinero = (n: number, decimales = 0) => (n < 0 ? '-$' : '$') + miles(Math.abs(n), decimales);

/** Formato compacto: $90,8 mil · $104 mil · $920 */
export function dineroCorto(n: number): string {
  const a = Math.abs(n);
  if (a >= 1000) {
    const valor = miles(a / 1000, a >= 100000 ? 0 : 1).replace(/,0$/, '');
    return `${n < 0 ? '-$' : '$'}${valor} mil`;
  }
  return dinero(n);
}

export const porcentaje = (x: number) => (Number.isFinite(x) ? `${Math.round(x * 100)}%` : '—');

/** AAAA-MM-DD -> DD/MM/AAAA */
export function fechaCorta(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
