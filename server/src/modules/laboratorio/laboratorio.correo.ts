// Correo de los informes de laboratorio: texto predeterminado (editable) y destinatarios por centro de costo.
import { consultarUna, ejecutar } from '../../db/database.js';
import { texto, type Validado } from '../../utils/validacion.js';

const CLAVE_PLANTILLA = 'laboratorio.correo.plantilla';

export interface PlantillaCorreo {
  asunto: string;
  mensaje: string;
}

/** Texto inicial. Marcadores que se reemplazan: {codigo} {identificacion} {seccion} {fecha} */
export const PLANTILLA_INICIAL: PlantillaCorreo = {
  asunto: 'Reporte {codigo} · {seccion} · {identificacion}',
  mensaje: 'Buen día, Estimados:\n\nAdjunto reporte {codigo} de {seccion} de {identificacion}.\n\nSaludos cordiales.',
};

export async function obtenerPlantilla(): Promise<PlantillaCorreo> {
  const fila = await consultarUna('SELECT valor FROM configuracion WHERE clave = ?', [CLAVE_PLANTILLA]);
  if (!fila) return PLANTILLA_INICIAL;
  try {
    const p = JSON.parse(String(fila.valor));
    return { asunto: String(p.asunto ?? ''), mensaje: String(p.mensaje ?? '') };
  } catch {
    return PLANTILLA_INICIAL;
  }
}

export async function guardarPlantilla(p: PlantillaCorreo): Promise<PlantillaCorreo> {
  await ejecutar(
    `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
    [CLAVE_PLANTILLA, JSON.stringify(p)],
  );
  return p;
}

export async function obtenerDestinatarios(sucursal: string): Promise<{ para: string; cc: string }> {
  const fila = await consultarUna('SELECT para, cc FROM lab_destinatario WHERE sucursal = ?', [sucursal]);
  return { para: String(fila?.para ?? ''), cc: String(fila?.cc ?? '') };
}

export async function guardarDestinatarios(sucursal: string, para: string, cc: string) {
  await ejecutar(
    `INSERT INTO lab_destinatario (sucursal, para, cc) VALUES (?, ?, ?)
     ON CONFLICT(sucursal) DO UPDATE SET para = excluded.para, cc = excluded.cc,
       actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
    [sucursal, para, cc],
  );
}

// ---------- validación ----------
export function validarPlantilla(body: Record<string, unknown> | undefined): Validado<PlantillaCorreo> {
  const asunto = texto(body?.asunto, 300);
  const mensaje = typeof body?.mensaje === 'string' ? body.mensaje.trim().slice(0, 5000) : '';
  if (!asunto || !mensaje) return { error: 'El asunto y el mensaje no pueden quedar vacíos.' };
  return { datos: { asunto, mensaje } };
}

const CORREO = /^[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+$/;

/** Lista de correos separados por ; o , → "a@x.com; b@y.com" (o el error) */
export function normalizarCorreos(valor: unknown): string | { error: string } {
  const lista = String(valor ?? '')
    .split(/[;,]/)
    .map((c) => c.trim())
    .filter(Boolean);
  const malo = lista.find((c) => !CORREO.test(c));
  return malo ? { error: `"${malo}" no es un correo válido.` } : lista.join('; ');
}
