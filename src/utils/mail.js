import nodemailer from 'nodemailer'
import { AppError } from './AppError.js'

function env(name, fallback = '') {
  return String(process.env[name] ?? fallback).trim()
}

/** Quita espacios (Google muestra la clave en grupos de 4). */
function cleanAppPassword(value) {
  return String(value || '').replace(/\s+/g, '')
}

function getFromIdentity() {
  const fromName = env('MAIL_FROM_NAME', 'Municipalidad de Trancas')
  const fromAddress =
    env('MAIL_FROM') || env('MAIL_USER') || 'areaderedes2026@gmail.com'
  return { fromName, fromAddress }
}

function isSmtpConfigured() {
  const user = env('MAIL_USER') || env('MAIL_FROM')
  const pass = cleanAppPassword(env('MAIL_PASS') || env('MAIL_APP_PASSWORD'))
  return Boolean(user && pass)
}

function isBrevoConfigured() {
  return Boolean(env('BREVO_API_KEY') || env('SENDINBLUE_API_KEY'))
}

function isResendConfigured() {
  return Boolean(env('RESEND_API_KEY'))
}

/** Hay al menos un proveedor de correo listo (API HTTPS o SMTP). */
export function isMailConfigured() {
  return isBrevoConfigured() || isResendConfigured() || isSmtpConfigured()
}

function getSmtpConfig() {
  const user = env('MAIL_USER') || env('MAIL_FROM') || 'areaderedes2026@gmail.com'
  const pass = cleanAppPassword(env('MAIL_PASS') || env('MAIL_APP_PASSWORD'))
  const { fromName, fromAddress } = getFromIdentity()
  const port = Number(env('MAIL_PORT', '465')) || 465
  const secureEnv = env('MAIL_SECURE', '')
  const secure =
    secureEnv === 'true' ? true : secureEnv === 'false' ? false : port === 465
  return {
    host: env('MAIL_HOST', 'smtp.gmail.com'),
    port,
    secure,
    user,
    pass,
    from: `"${fromName}" <${fromAddress}>`,
    fromName,
    fromAddress,
  }
}

function buildTransport({ host, port, secure, user, pass }) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' },
  })
}

function smtpAttemptList(cfg) {
  const primary = { host: cfg.host, port: cfg.port, secure: cfg.secure }
  const fallbacks = [
    { host: 'smtp.gmail.com', port: 465, secure: true },
    { host: 'smtp.gmail.com', port: 587, secure: false },
  ]
  const seen = new Set()
  const out = []
  for (const a of [primary, ...fallbacks]) {
    const key = `${a.host}:${a.port}:${a.secure ? 1 : 0}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}

async function sendViaBrevo({ to, subject, text, html }) {
  const apiKey = env('BREVO_API_KEY') || env('SENDINBLUE_API_KEY')
  const { fromName, fromAddress } = getFromIdentity()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: fromName, email: fromAddress },
        to: [{ email: to }],
        subject,
        textContent: text || undefined,
        htmlContent: html || undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.code) ? data.code.join(', ') : '') ||
        `HTTP ${res.status}`
      throw new Error(String(detail))
    }
    console.info(`[mail] enviado OK vía Brevo API → ${to}`)
    return {
      messageId: data?.messageId ? String(data.messageId) : null,
      accepted: [to],
      via: 'brevo-api',
    }
  } finally {
    clearTimeout(timer)
  }
}

async function sendViaResend({ to, subject, text, html }) {
  const apiKey = env('RESEND_API_KEY')
  const { fromName, fromAddress } = getFromIdentity()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [to],
        subject,
        text: text || undefined,
        html: html || undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = data?.message || data?.error || `HTTP ${res.status}`
      throw new Error(String(detail))
    }
    console.info(`[mail] enviado OK vía Resend API → ${to}`)
    return {
      messageId: data?.id ? String(data.id) : null,
      accepted: [to],
      via: 'resend-api',
    }
  } finally {
    clearTimeout(timer)
  }
}

async function sendViaSmtp({ to, subject, text, html }) {
  const cfg = getSmtpConfig()
  const payload = {
    from: cfg.from,
    to,
    subject,
    text,
    html: html || undefined,
  }
  const errors = []
  for (const attempt of smtpAttemptList(cfg)) {
    const label = `${attempt.host}:${attempt.port}/${attempt.secure ? 'ssl' : 'starttls'}`
    try {
      const transporter = buildTransport({
        ...attempt,
        user: cfg.user,
        pass: cfg.pass,
      })
      const info = await transporter.sendMail(payload)
      try {
        transporter.close()
      } catch {
        /* ignore */
      }
      console.info(`[mail] enviado OK vía ${label} → ${to}`)
      return {
        messageId: info?.messageId || null,
        accepted: Array.isArray(info?.accepted) ? info.accepted : [],
        via: label,
      }
    } catch (err) {
      const msg = err?.message || String(err)
      console.error(`[mail] falló ${label}:`, msg)
      errors.push(`${label}: ${msg}`)
    }
  }
  throw new Error(errors.slice(0, 2).join(' | ') || 'Error SMTP')
}

/**
 * Envía correo. En Railway prioriza API HTTPS (Brevo/Resend): SMTP de Gmail suele estar bloqueado.
 * @param {{ to: string, subject: string, text: string, html?: string }} options
 */
export async function sendMail({ to, subject, text, html }) {
  const recipient = String(to || '').trim()
  if (!recipient) {
    throw new AppError('No hay destinatario de correo.', 400)
  }
  if (!isMailConfigured()) {
    throw new AppError(
      'El envío de correo no está configurado. Definí BREVO_API_KEY (recomendado en Railway) o MAIL_USER/MAIL_PASS.',
      503,
    )
  }

  const subjectSafe = String(subject || '').trim() || 'Municipalidad de Trancas'
  const textSafe = String(text || '').trim()
  const htmlSafe = html ? String(html) : undefined
  const payload = {
    to: recipient,
    subject: subjectSafe,
    text: textSafe,
    html: htmlSafe,
  }

  const errors = []

  // 1) Brevo (HTTPS) — funciona en Railway, plan gratis, remitente Gmail verificable.
  if (isBrevoConfigured()) {
    try {
      return await sendViaBrevo(payload)
    } catch (err) {
      const msg = err?.name === 'AbortError' ? 'Timeout Brevo API' : err?.message || String(err)
      console.error('[mail] Brevo falló:', msg)
      errors.push(`brevo: ${msg}`)
    }
  }

  // 2) Resend (HTTPS) — alternativa; requiere dominio verificado para producción.
  if (isResendConfigured()) {
    try {
      return await sendViaResend(payload)
    } catch (err) {
      const msg = err?.name === 'AbortError' ? 'Timeout Resend API' : err?.message || String(err)
      console.error('[mail] Resend falló:', msg)
      errors.push(`resend: ${msg}`)
    }
  }

  // 3) SMTP (útil en local; en Railway Gmail suele dar Connection timeout).
  if (isSmtpConfigured()) {
    try {
      return await sendViaSmtp(payload)
    } catch (err) {
      const msg = err?.message || String(err)
      console.error('[mail] SMTP falló:', msg)
      errors.push(`smtp: ${msg}`)
    }
  }

  throw new AppError(
    `No se pudo enviar el correo. ${errors.slice(0, 2).join(' | ') || 'Sin proveedor disponible'}`,
    503,
  )
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildFdcStallConfirmationEmail(application) {
  const id = application?.id != null ? String(application.id) : '—'
  const name = String(application?.fullName || '').trim() || 'Vecino/a'
  const rubro =
    application?.rubro === 'Otro' && application?.rubroOther
      ? `Otro: ${application.rubroOther}`
      : String(application?.rubro || '—')
  const subject = `Constancia de preinscripción FDC 2026 — Solicitud N° ${id}`
  const text = [
    `Hola ${name},`,
    '',
    'Recibimos tu preinscripción para un puesto comercial en la Fiesta Nacional e Internacional del Caballo 2026.',
    '',
    `Número de solicitud: ${id}`,
    `Rubro: ${rubro}`,
    `DNI: ${application?.dni || '—'}`,
    `Teléfono: ${application?.phone || '—'}`,
    `Localidad: ${application?.locality || '—'}`,
    '',
    'IMPORTANTE: Esta preinscripción no implica la adjudicación del espacio. La organización evaluará cada solicitud según disponibilidad y requisitos.',
    '',
    'Te contactaremos si necesitamos más información o cuando haya novedades sobre la asignación.',
    '',
    'Municipalidad de Trancas',
    'Área de Redes — areaderedes2026@gmail.com',
  ].join('\n')

  const html = `
    <div style="font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#171b22;max-width:560px;margin:0 auto;padding:24px;">
      <p style="margin:0 0 12px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#0369a1;font-weight:700;">Fiesta del Caballo 2026</p>
      <h1 style="margin:0 0 16px;font-size:22px;">Constancia de preinscripción</h1>
      <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
      <p>Recibimos tu solicitud de puesto comercial. Guardá este correo como comprobante.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f7f7f5;border-radius:12px;">
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;">Número de solicitud</td><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;font-weight:700;">#${escapeHtml(id)}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;">Rubro</td><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;">${escapeHtml(rubro)}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;">DNI</td><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;">${escapeHtml(application?.dni || '—')}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;">Teléfono</td><td style="padding:10px 14px;border-bottom:1px solid #e8e5dd;">${escapeHtml(application?.phone || '—')}</td></tr>
        <tr><td style="padding:10px 14px;">Localidad</td><td style="padding:10px 14px;">${escapeHtml(application?.locality || '—')}</td></tr>
      </table>
      <p style="padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;font-size:14px;">
        <strong>Importante:</strong> esta preinscripción no implica la adjudicación del espacio. La organización evaluará cada solicitud según disponibilidad y requisitos.
      </p>
      <p style="margin-top:24px;font-size:13px;color:#4b505a;">Municipalidad de Trancas · Área de Redes</p>
    </div>
  `

  return { subject, text, html }
}
