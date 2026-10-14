// Envío de correos por SMTP (avisos del calendario). Sin la cuenta configurada no se envía nada.
import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

let transporte: Transporter | null = null;

/** ¿Hay una cuenta de envío configurada (SMTP_HOST, SMTP_USER y SMTP_PASS)? */
export const correoConfigurado = () => Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

/** Remitente visible de los correos */
export const remitente = () => env.smtpFrom || `SIG Naturisa <${env.smtpUser}>`;

export interface Correo {
  para: string[];
  asunto: string;
  html: string;
  /** Versión en texto plano (clientes de correo sin HTML) */
  texto: string;
}

export async function enviarCorreo(c: Correo): Promise<void> {
  if (!correoConfigurado()) throw new Error('Falta configurar la cuenta de correo que envía los avisos (SMTP).');
  transporte ??= nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
  await transporte.sendMail({ from: remitente(), to: c.para, subject: c.asunto, html: c.html, text: c.texto });
}

/** Escapa texto escrito por los usuarios antes de ponerlo en el HTML de un correo */
export const escaparHtml = (t: string) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
