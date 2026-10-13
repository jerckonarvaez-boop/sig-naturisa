// Texto del correo de un informe: reemplaza los marcadores de la plantilla con los datos del informe.
import { fechaCorta } from '@/utils/fechas';
import type { PlantillaCorreo } from '../services/laboratorio.api';
import type { SeccionLab } from '../types';

export const MARCADORES = [
  ['{codigo}', 'código del informe'],
  ['{identificacion}', 'centro de costo o cliente'],
  ['{seccion}', 'Análisis de Agua, de Suelo…'],
  ['{fecha}', 'fecha de emisión'],
];

interface DatosCorreo {
  codigo: string;
  sucursal: string;
  fechaEmision: string;
}

export function rellenar(plantilla: PlantillaCorreo, seccion: SeccionLab, d: DatosCorreo): PlantillaCorreo {
  const valores: Record<string, string> = {
    '{codigo}': d.codigo,
    '{identificacion}': d.sucursal,
    '{seccion}': seccion.nombre,
    '{fecha}': d.fechaEmision ? fechaCorta(d.fechaEmision) : '',
  };
  const reemplazar = (t: string) => t.replace(/\{(codigo|identificacion|seccion|fecha)\}/g, (m) => valores[m] ?? m);
  return { asunto: reemplazar(plantilla.asunto), mensaje: reemplazar(plantilla.mensaje) };
}

/** Nombre de archivo sin tildes ni caracteres no permitidos: "AA-2026-009 Pesjoya" */
export const nombreArchivo = (d: DatosCorreo) =>
  `${d.codigo} ${d.sucursal}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w .-]+/g, '')
    .trim();
