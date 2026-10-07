// Ayudas comunes para validar los datos que llegan a la API.

/** Resultado de un validador: los datos ya limpios, o el mensaje de error para el usuario */
export type Validado<T> = { datos: T } | { error: string };

/** Texto recortado (sin espacios a los lados) y limitado a `max` caracteres; '' si no es texto */
export const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha AAAA-MM-DD válida */
export const esFecha = (v: unknown): v is string => typeof v === 'string' && FECHA.test(v) && !Number.isNaN(Date.parse(v));

/** ¿El valor está entre las opciones permitidas? */
export const esUnoDe = <T extends string>(opciones: readonly T[], v: unknown): v is T => (opciones as readonly unknown[]).includes(v);
