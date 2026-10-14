// Avisos por correo del calendario: N días antes (7 por defecto) de cada evento programado se envía un
// correo a los destinatarios configurados, una sola vez por evento. El servidor revisa cada 30 minutos
// mientras está encendido (GitHub lo mantiene despierto en horario laboral); si una revisión no ocurre,
// la siguiente envía lo pendiente, porque se buscan todos los eventos que empiezan de hoy a hoy + N días.
import { env } from '../../config/env.js';
import { consultarUna, ejecutar } from '../../db/database.js';
import { correoConfigurado, enviarCorreo, escaparHtml, remitente, type Correo } from '../../utils/correo.js';
import { normalizarCorreos, type Validado } from '../../utils/validacion.js';
import { eventosPorAvisar, marcarAvisados, proximosEventos } from './eventos.service.js';
import { NOMBRE_TIPO, type Evento } from './eventos.types.js';

const CLAVE = 'eventos.avisos';
const CADA = 30 * 60 * 1000;

export interface ConfigAvisos {
  /** Correos separados por "; " */
  para: string;
  /** Días de anticipación */
  dias: number;
}

const INICIAL: ConfigAvisos = { para: '', dias: 7 };

export async function obtenerConfigAvisos(): Promise<ConfigAvisos> {
  const fila = await consultarUna('SELECT valor FROM configuracion WHERE clave = ?', [CLAVE]);
  if (!fila) return INICIAL;
  try {
    const c = JSON.parse(String(fila.valor));
    return { para: String(c.para ?? ''), dias: Number(c.dias) || INICIAL.dias };
  } catch {
    return INICIAL;
  }
}

export async function guardarConfigAvisos(c: ConfigAvisos): Promise<ConfigAvisos> {
  await ejecutar(
    `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
     ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, actualizado_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`,
    [CLAVE, JSON.stringify(c)],
  );
  return c;
}

export function validarConfigAvisos(body: Record<string, unknown> | undefined): Validado<ConfigAvisos> {
  const para = normalizarCorreos(body?.para);
  if (typeof para !== 'string') return para;
  const dias = body?.dias;
  if (typeof dias !== 'number' || !Number.isInteger(dias) || dias < 1 || dias > 60) {
    return { error: 'Los días de anticipación deben ser un número entero entre 1 y 60.' };
  }
  return { datos: { para, dias } };
}

// ---------- fechas (Ecuador, UTC-5 sin horario de verano) ----------
const hoyEcuador = () => new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
const sumarDias = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const diasEntre = (desde: string, hasta: string) => Math.round((Date.parse(hasta) - Date.parse(desde)) / 864e5);
const fechaLarga = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fechaCorta = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const faltan = (e: Evento, hoy: string) => {
  const n = diasEntre(hoy, e.fechaInicio);
  return n <= 0 ? 'Hoy' : n === 1 ? 'Mañana' : `En ${n} días`;
};

/** Correo con la lista de eventos (asunto, HTML y texto plano) */
export function armarCorreo(eventos: Evento[], hoy: string, prueba = false): Omit<Correo, 'para'> {
  const enlace = `${env.appUrl.replace(/\/$/, '')}/calendario`;
  const asunto =
    (prueba ? '[Prueba] ' : '') +
    (eventos.length === 1
      ? `SIG · Recordatorio: ${eventos[0].titulo} (${fechaCorta(eventos[0].fechaInicio)})`
      : eventos.length
        ? `SIG · Recordatorio: ${eventos.length} eventos próximos`
        : 'SIG · Correo de prueba de avisos del calendario');

  const filas = eventos
    .map((e) => {
      const detalle = [e.sucursal, e.responsable && `Responsable: ${e.responsable}`].filter(Boolean).join(' · ');
      const fin = e.fechaFin ? `<br>al ${fechaLarga(e.fechaFin)}` : '';
      return `<tr>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;width:190px">
    <b style="color:#0b2e4f">${faltan(e, hoy)}</b><br><span style="color:#64748b;font-size:12px">${fechaLarga(e.fechaInicio)}${fin}</span>
  </td>
  <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top">
    <span style="color:#0369a1;font-size:12px;font-weight:bold">${NOMBRE_TIPO[e.tipo] ?? e.tipo}</span><br>
    <b>${escaparHtml(e.titulo)}</b>${detalle ? `<br><span style="color:#64748b;font-size:12px">${escaparHtml(detalle)}</span>` : ''}
  </td>
</tr>`;
    })
    .join('\n');

  const intro = prueba
    ? 'Este es un correo de prueba: así llegarán los avisos del calendario del SIG.'
    : eventos.length === 1
      ? 'Le recordamos el siguiente evento programado en el calendario del SIG:'
      : 'Le recordamos los siguientes eventos programados en el calendario del SIG:';

  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#0f172a;max-width:640px">
<div style="background:#0b2e4f;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;font-size:16px;font-weight:bold">SIG Naturisa · Calendario</div>
<div style="border:1px solid #e2e8f0;border-top:0;padding:16px 18px;border-radius:0 0 8px 8px">
<p style="margin:0 0 12px">Buen día,</p>
<p style="margin:0 0 12px">${intro}</p>
${eventos.length ? `<table style="border-collapse:collapse;width:100%">${filas}</table>` : '<p style="color:#64748b">No hay eventos programados en los próximos días.</p>'}
<p style="margin:18px 0 6px"><a href="${enlace}" style="background:#0b2e4f;color:#fff;padding:9px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Abrir el calendario</a></p>
<p style="margin:16px 0 0;color:#94a3b8;font-size:12px">Aviso automático del Sistema Integrado de Gestión. Puede desactivarlo en cada evento ("Avisarme por correo") o cambiar los destinatarios en Calendario ▸ Avisos por correo.</p>
</div></div>`;

  const texto = [
    'Buen día,',
    '',
    intro,
    '',
    ...eventos.map(
      (e) =>
        `- ${faltan(e, hoy)} (${fechaLarga(e.fechaInicio)}): ${NOMBRE_TIPO[e.tipo] ?? e.tipo} · ${e.titulo}` +
        (e.sucursal ? ` · ${e.sucursal}` : '') +
        (e.responsable ? ` · Responsable: ${e.responsable}` : ''),
    ),
    '',
    `Abrir el calendario: ${enlace}`,
  ].join('\n');

  return { asunto, html, texto };
}

const destinatarios = (c: ConfigAvisos) =>
  c.para
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

let enCurso = false;

/** Envía un correo con los eventos pendientes de aviso (si hay) y los marca como avisados */
export async function revisarAvisos(): Promise<{ enviados: number }> {
  if (enCurso || !correoConfigurado()) return { enviados: 0 };
  enCurso = true;
  try {
    const config = await obtenerConfigAvisos();
    const para = destinatarios(config);
    if (!para.length) return { enviados: 0 };
    const hoy = hoyEcuador();
    const eventos = await eventosPorAvisar(hoy, sumarDias(hoy, config.dias));
    if (!eventos.length) return { enviados: 0 };
    await enviarCorreo({ para, ...armarCorreo(eventos, hoy) });
    await marcarAvisados(eventos.map((e) => e.id));
    return { enviados: eventos.length };
  } finally {
    enCurso = false;
  }
}

/** Correo de prueba a los destinatarios configurados, con los próximos eventos (no los marca como avisados) */
export async function enviarPrueba(): Promise<{ para: string[] }> {
  const config = await obtenerConfigAvisos();
  const para = destinatarios(config);
  if (!para.length) throw new Error('Agregue al menos un correo destinatario y guarde antes de probar.');
  const hoy = hoyEcuador();
  await enviarCorreo({ para, ...armarCorreo(await proximosEventos(hoy, sumarDias(hoy, config.dias)), hoy, true) });
  return { para };
}

/** Estado para la interfaz: configuración + si hay cuenta de envío */
export async function estadoAvisos() {
  return { ...(await obtenerConfigAvisos()), correoConfigurado: correoConfigurado(), remitente: correoConfigurado() ? remitente() : '' };
}

/** Revisión periódica (se llama al arrancar el servidor) */
export function iniciarAvisos() {
  if (!correoConfigurado()) {
    console.log('[avisos] sin cuenta de correo (SMTP_HOST/SMTP_USER/SMTP_PASS): no se envían avisos del calendario');
    return;
  }
  const revisar = () =>
    revisarAvisos()
      .then(({ enviados }) => enviados && console.log(`[avisos] correo enviado con ${enviados} evento(s)`))
      .catch((e) => console.error('[avisos] no se pudo enviar:', (e as Error).message));
  setTimeout(revisar, 60_000);
  setInterval(revisar, CADA);
  console.log(`[avisos] avisos del calendario activos (remitente ${remitente()})`);
}
