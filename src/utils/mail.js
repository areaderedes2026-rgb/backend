import nodemailer from 'nodemailer'
import { AppError } from './AppError.js'

function env(name, fallback = '') {
  return String(process.env[name] ?? fallback).trim()
}

function cleanAppPassword(value) {
  return String(value || '').replace(/\s+/g, '')
}

function getSmtpConfig() {
  const user = env('MAIL_USER') || env('MAIL_FROM') || 'areaderedes2026@gmail.com'
  const pass = cleanAppPassword(env('MAIL_PASS') || env('MAIL_APP_PASSWORD'))
  const fromName = env('MAIL_FROM_NAME', 'Municipalidad de Trancas')
  const fromAddress = env('MAIL_FROM') || user
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
    fromName,
    fromAddress,
    from: `"${fromName}" <${fromAddress}>`,
  }
}

function appscriptUrl() {
  return env('MAIL_APPSCRIPT_URL') || env('GMAIL_APPSCRIPT_URL')
}

function resendApiKey() {
  return env('RESEND_API_KEY')
}

/**
 * Railway bloquea SMTP (465/587) → Connection timeout.
 * En producción usamos HTTPS (Google Apps Script o Resend), gratis.
 */
export function getMailTransport() {
  const forced = env('MAIL_TRANSPORT', 'auto').toLowerCase()
  if (forced === 'appscript' || forced === 'resend' || forced === 'smtp') return forced
  if (appscriptUrl()) return 'appscript'
  if (resendApiKey()) return 'resend'
  if (getSmtpConfig().pass) return 'smtp'
  return 'none'
}

export function isMailConfigured() {
  const t = getMailTransport()
  if (t === 'appscript') return Boolean(appscriptUrl())
  if (t === 'resend') return Boolean(resendApiKey())
  if (t === 'smtp') {
    const cfg = getSmtpConfig()
    return Boolean(cfg.user && cfg.pass)
  }
  return false
}

async function sendViaAppsScript({ to, subject, text, html }) {
  const url = appscriptUrl()
  if (!url) throw new AppError('Falta MAIL_APPSCRIPT_URL.', 503)

  const secret = env('MAIL_APPSCRIPT_SECRET') || env('GMAIL_APPSCRIPT_SECRET')
  const cfg = getSmtpConfig()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: secret || undefined,
        to,
        subject,
        text,
        html: html || undefined,
        fromName: cfg.fromName,
      }),
      signal: controller.signal,
      redirect: 'follow',
    })
    const raw = await res.text()
    let data = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = { raw }
    }
    if (!res.ok || data.ok === false) {
      throw new Error(
        data.error || data.message || raw?.slice(0, 200) || `HTTP ${res.status}`,
      )
    }
    console.info(`[mail] enviado OK vía Google Apps Script → ${to}`)
    return { messageId: data.messageId || null, accepted: [to], via: 'appscript' }
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Timeout al llamar Google Apps Script.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function sendViaResend({ to, subject, text, html }) {
  const key = resendApiKey()
  if (!key) throw new AppError('Falta RESEND_API_KEY.', 503)
  const cfg = getSmtpConfig()
  const from = env('RESEND_FROM') || `${cfg.fromName} <${cfg.fromAddress}>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html: html || undefined,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Resend HTTP ${res.status}`)
  }
  console.info(`[mail] enviado OK vía Resend → ${to}`)
  return { messageId: data?.id || null, accepted: [to], via: 'resend' }
}

function buildTransport({ host, port, secure, user, pass }) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure && port === 587,
    // Timeouts cortos: en Railway SMTP nunca conecta y no debe demorar el formulario.
    connectionTimeout: 4_000,
    greetingTimeout: 4_000,
    socketTimeout: 8_000,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' },
  })
}

async function sendViaSmtp({ to, subject, text, html }) {
  const cfg = getSmtpConfig()
  if (!cfg.user || !cfg.pass) {
    throw new AppError('Faltan MAIL_USER / MAIL_PASS para SMTP.', 503)
  }

  const attempts = [
    { host: cfg.host, port: cfg.port, secure: cfg.secure },
    { host: 'smtp.gmail.com', port: 465, secure: true },
    { host: 'smtp.gmail.com', port: 587, secure: false },
  ]
  const seen = new Set()
  const errors = []

  for (const attempt of attempts) {
    const key = `${attempt.host}:${attempt.port}:${attempt.secure ? 1 : 0}`
    if (seen.has(key)) continue
    seen.add(key)
    const label = `${attempt.host}:${attempt.port}/${attempt.secure ? 'ssl' : 'starttls'}`
    try {
      const transporter = buildTransport({ ...attempt, user: cfg.user, pass: cfg.pass })
      const info = await transporter.sendMail({
        from: cfg.from,
        to,
        subject,
        text,
        html: html || undefined,
      })
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

  throw new Error(
    `SMTP bloqueado o inválido. En Railway usá MAIL_APPSCRIPT_URL (gratis). ${errors.slice(0, 2).join(' | ')}`,
  )
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} options
 */
export async function sendMail({ to, subject, text, html }) {
  const recipient = String(to || '').trim()
  if (!recipient) {
    throw new AppError('No hay destinatario de correo.', 400)
  }
  if (!isMailConfigured()) {
    throw new AppError(
      'Correo no configurado. En Railway definí MAIL_APPSCRIPT_URL (Google Apps Script, gratis). En local podés usar MAIL_PASS (SMTP).',
      503,
    )
  }

  const payload = {
    to: recipient,
    subject: String(subject || '').trim() || 'Municipalidad de Trancas',
    text: String(text || '').trim(),
    html: html ? String(html) : undefined,
  }

  const transport = getMailTransport()
  if (transport === 'appscript') return sendViaAppsScript(payload)
  if (transport === 'resend') return sendViaResend(payload)
  return sendViaSmtp(payload)
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
