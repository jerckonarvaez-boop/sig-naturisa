/** "Usuario Demo" -> "UD" */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** Fecha larga en español: "Martes 6 de octubre de 2026" */
export function formatLongDate(date: Date): string {
  const text = date.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return text.charAt(0).toUpperCase() + text.slice(1).replace(',', '');
}
