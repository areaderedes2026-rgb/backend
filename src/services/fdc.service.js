import {
  createFdcStallApplicationRow,
  deleteFdcStallApplicationRow,
  findFdcStallApplicationById,
  findFdcStallDuplicateByContact,
  getFdcPageContentRow,
  listFdcStallApplications,
  updateFdcStallApplicationEmailMeta,
  updateFdcStallApplicationStatusRow,
  updateFdcWhatsappMessageRow,
  upsertFdcPageContentRow,
} from '../models/fdc.model.js'
import { AppError } from '../utils/AppError.js'
import { assertOptimisticLock } from '../utils/concurrency.js'
import {
  buildFdcStallConfirmationEmail,
  isMailConfigured,
  sendMail,
} from '../utils/mail.js'
import { sanitizePageHeroCoverPayload } from '../utils/pageHeroCover.js'

export const FDC_RUBROS = [
  'Kiosco',
  'Fonda',
  'Artesanías',
  'Drugstore',
  'Food Truck',
  'Stand Comercial',
  'Instituciones',
  'Vivero / Plantas',
  'Otro',
]

const ALLOWED_STATUS = new Set(['sin_resolver', 'leida', 'resuelta'])

function cleanString(value, maxLen = 0) {
  const v = String(value || '').trim()
  if (!maxLen) return v
  return v.slice(0, maxLen)
}

function cleanMultiline(value, maxLen = 0) {
  const v = String(value || '').replace(/\r\n/g, '\n').trim()
  if (!maxLen) return v
  return v.slice(0, maxLen)
}

function cleanDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function sanitizeParagraphs(input) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const p of raw.slice(0, 12)) {
    const s = cleanMultiline(p, 2000)
    if (s) out.push(s)
  }
  return out
}

function sanitizeHighlights(input) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const h of raw.slice(0, 6)) {
    const label = cleanString(h?.label, 100)
    const value = cleanString(h?.value, 120)
    if (!label && !value) continue
    out.push({ label, value })
  }
  return out
}

function todayYmdLocal() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function assertFormWindowOpen(page) {
  const from = page?.formOpenFrom ? String(page.formOpenFrom).slice(0, 10) : null
  const until = page?.formOpenUntil ? String(page.formOpenUntil).slice(0, 10) : null
  const today = todayYmdLocal()
  if (from && today < from) {
    throw new AppError(
      `La preinscripción abre el ${from.split('-').reverse().join('/')}.`,
      403,
    )
  }
  if (until && today > until) {
    throw new AppError(
      `La preinscripción cerró el ${until.split('-').reverse().join('/')}.`,
      403,
    )
  }
}

function sanitizePagePayload(payload, { current } = {}) {
  const heroCover = sanitizePageHeroCoverPayload(
    {
      heroImageUrl: payload?.heroImageUrl,
      overlayOpacity: payload?.overlayOpacity,
      heroBadge: payload?.heroEyebrow,
      heroTitle: payload?.heroTitle,
      heroSubtitle: payload?.heroSubtitle,
      heroSearchPlaceholder: payload?.heroSearchPlaceholder,
      showHeroBadge: payload?.showHeroBadge,
      showHeroTitle: payload?.showHeroTitle,
      showHeroSubtitle: payload?.showHeroSubtitle,
      showSearch: payload?.showSearch,
      showPrimaryButton: payload?.showPrimaryButton,
      primaryLabel: payload?.heroPrimaryLabel,
      primaryHref: payload?.heroPrimaryHref,
      showSecondaryButton: payload?.showSecondaryButton,
      secondaryLabel: payload?.heroSecondaryLabel,
      secondaryHref: payload?.heroSecondaryHref,
    },
    {
      current: current
        ? {
            overlayOpacity: current.overlayOpacity,
            showHeroBadge: current.showHeroBadge,
            showHeroTitle: current.showHeroTitle,
            showHeroSubtitle: current.showHeroSubtitle,
            showSearch: current.showSearch,
            showPrimaryButton: current.showPrimaryButton,
            showSecondaryButton: current.showSecondaryButton,
          }
        : undefined,
    },
  )

  let whatsappMessage
  if (Object.prototype.hasOwnProperty.call(payload || {}, 'whatsappMessage')) {
    const raw = cleanMultiline(payload?.whatsappMessage, 3500)
    whatsappMessage = raw && raw.trim() ? raw : null
  } else {
    const preserved = current?.whatsappMessage
    whatsappMessage =
      preserved != null && String(preserved).trim() !== '' ? String(preserved).trim() : null
  }

  return {
    heroEyebrow: heroCover.heroBadge,
    heroTitle: heroCover.heroTitle,
    heroSubtitle: heroCover.heroSubtitle,
    heroImageUrl: heroCover.heroImageUrl,
    overlayOpacity: heroCover.overlayOpacity,
    heroPrimaryLabel: heroCover.primaryLabel,
    heroPrimaryHref: heroCover.primaryHref,
    heroSecondaryLabel: heroCover.secondaryLabel,
    heroSecondaryHref: heroCover.secondaryHref,
    heroSearchPlaceholder: heroCover.heroSearchPlaceholder,
    showHeroBadge: heroCover.showHeroBadge,
    showHeroTitle: heroCover.showHeroTitle,
    showHeroSubtitle: heroCover.showHeroSubtitle,
    showSearch: heroCover.showSearch,
    showPrimaryButton: heroCover.showPrimaryButton,
    showSecondaryButton: heroCover.showSecondaryButton,
    introTitle: cleanString(payload?.introTitle, 220),
    introParagraphs: sanitizeParagraphs(payload?.introParagraphs),
    highlights: sanitizeHighlights(payload?.highlights),
    formNotice: cleanMultiline(payload?.formNotice, 2000),
    formOpenFrom: cleanDate(payload?.formOpenFrom),
    formOpenUntil: cleanDate(payload?.formOpenUntil),
    ctaTitle: cleanString(payload?.ctaTitle, 240),
    ctaBody: cleanMultiline(payload?.ctaBody, 2500),
    whatsappMessage,
  }
}

function sanitizeApplicationPayload(payload) {
  const fullName = cleanString(payload?.fullName, 180)
  const dni = cleanString(payload?.dni, 20).replace(/[^\d]/g, '')
  const address = cleanString(payload?.address, 320)
  const locality = cleanString(payload?.locality, 160)
  const phone = cleanString(payload?.phone, 80)
  const email = cleanString(payload?.email, 180).toLowerCase()
  let rubro = cleanString(payload?.rubro, 80)
  const rubroOther = cleanString(payload?.rubroOther, 180)
  const participatedBefore = Boolean(payload?.participatedBefore)
  const participationYears = cleanString(payload?.participationYears, 120)

  if (!fullName) throw new AppError('El apellido y nombre son obligatorios.', 400)
  if (!dni || dni.length < 7 || dni.length > 10) {
    throw new AppError('El DNI es obligatorio y debe ser válido.', 400)
  }
  if (!address) throw new AppError('El domicilio es obligatorio.', 400)
  if (!locality) throw new AppError('La localidad es obligatoria.', 400)
  if (!phone || phone.length < 6) {
    throw new AppError('El teléfono es obligatorio (mínimo 6 caracteres).', 400)
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('El correo electrónico es obligatorio y debe ser válido.', 400)
  }
  if (!FDC_RUBROS.includes(rubro)) {
    throw new AppError('Seleccioná un rubro válido.', 400)
  }
  if (rubro === 'Otro' && !rubroOther) {
    throw new AppError('Indicá el rubro en «Otro».', 400)
  }
  if (participatedBefore && !participationYears) {
    throw new AppError('Indicá el/los año/s de participación anterior.', 400)
  }

  return {
    fullName,
    dni,
    address,
    locality,
    phone,
    email,
    rubro,
    rubroOther: rubro === 'Otro' ? rubroOther : '',
    participatedBefore,
    participationYears: participatedBefore ? participationYears : '',
    // Documentación / aviso: solo informativos en el front; se registran como leídos.
    dniCopyAck: true,
    acceptedNotice: true,
    status: 'sin_resolver',
  }
}

function stripInternalPageFields(content) {
  if (!content) return null
  const { whatsappMessage, ...rest } = content
  return rest
}

export async function getFdcPageContentPublic() {
  return stripInternalPageFields(await getFdcPageContentRow())
}

export async function getFdcPageContentAdmin() {
  return getFdcPageContentRow()
}

export async function saveFdcPageContent(payload) {
  const current = await getFdcPageContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'contenido de Fiesta del Caballo',
    Boolean(payload?.forceOverwrite),
  )
  const data = sanitizePagePayload(payload, { current })
  return upsertFdcPageContentRow(data)
}

export async function getFdcWhatsappTemplate() {
  const row = await getFdcPageContentRow()
  if (!row) return { message: '', updatedAt: null }
  return {
    message: row.whatsappMessage || '',
    updatedAt: row.updatedAt,
  }
}

export async function saveFdcWhatsappTemplate({
  message,
  expectedUpdatedAt,
  forceOverwrite = false,
}) {
  const current = await getFdcPageContentRow()
  if (!current) {
    throw new AppError(
      'Todavía no hay contenido de Fiesta del Caballo. Guardalo una vez desde esa sección y reintentá.',
      404,
    )
  }
  assertOptimisticLock(
    expectedUpdatedAt,
    current.updatedAt,
    'plantilla de WhatsApp FDC',
    Boolean(forceOverwrite),
  )
  const cleaned = cleanMultiline(message, 3500)
  await updateFdcWhatsappMessageRow(cleaned || '')
  const next = await getFdcPageContentRow()
  return {
    message: next?.whatsappMessage || '',
    updatedAt: next?.updatedAt,
  }
}

async function sendConfirmationEmail(application) {
  if (!isMailConfigured()) {
    await updateFdcStallApplicationEmailMeta(application.id, {
      emailSentAt: null,
      emailError:
        'Correo no configurado. En Railway usá MAIL_APPSCRIPT_URL (Google Apps Script, gratis).',
    })
    return { sent: false, reason: 'not_configured' }
  }
  try {
    const mail = buildFdcStallConfirmationEmail(application)
    await sendMail({
      to: application.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    await updateFdcStallApplicationEmailMeta(application.id, {
      emailSentAt: new Date(),
      emailError: '',
    })
    return { sent: true }
  } catch (e) {
    const msg = e?.message || 'No se pudo enviar el correo.'
    console.error('[fdc] email error:', msg)
    await updateFdcStallApplicationEmailMeta(application.id, {
      emailSentAt: null,
      emailError: msg,
    })
    return { sent: false, reason: msg }
  }
}

function queueConfirmationEmail(application) {
  // Nunca bloquear el POST del formulario (SMTP en Railway cuelga 20–40s).
  setImmediate(() => {
    void sendConfirmationEmail(application).catch((err) => {
      console.error('[fdc] confirmation email failed:', err?.message || err)
    })
  })
}

export async function createFdcStallApplication(payload) {
  const page = await getFdcPageContentRow()
  assertFormWindowOpen(page)
  const data = sanitizeApplicationPayload(payload)

  const duplicate = await findFdcStallDuplicateByContact({
    email: data.email,
    phone: data.phone,
  })
  if (duplicate?.field === 'email') {
    throw new AppError(
      `Ya se registró una preinscripción con este correo electrónico (solicitud N° ${duplicate.application.id}). Si necesitás corregir datos, comunicate con la municipalidad.`,
      409,
    )
  }
  if (duplicate?.field === 'phone') {
    throw new AppError(
      `Ya se registró una preinscripción con este número de teléfono (solicitud N° ${duplicate.application.id}). Si necesitás corregir datos, comunicate con la municipalidad.`,
      409,
    )
  }

  const created = await createFdcStallApplicationRow(data)
  const emailQueued = isMailConfigured()
  queueConfirmationEmail(created)

  return {
    application: created,
    emailSent: false,
    emailQueued,
    emailError: emailQueued
      ? ''
      : 'Correo no configurado. En Railway usá MAIL_APPSCRIPT_URL (gratis).',
  }
}

export async function listFdcStallApplicationsAdmin({ status = '' } = {}) {
  return listFdcStallApplications({ status })
}

export async function getFdcStallApplicationAdmin(id) {
  const row = await findFdcStallApplicationById(id)
  if (!row) throw new AppError('Solicitud no encontrada.', 404)
  return row
}

export async function setFdcStallApplicationStatus(
  id,
  status,
  expectedUpdatedAt,
  forceOverwrite = false,
) {
  const current = await findFdcStallApplicationById(id)
  if (!current) throw new AppError('Solicitud no encontrada.', 404)
  assertOptimisticLock(
    expectedUpdatedAt,
    current.updatedAt,
    'solicitud de puesto FDC',
    Boolean(forceOverwrite),
  )
  const nextStatus = cleanString(status, 24).toLowerCase()
  if (!ALLOWED_STATUS.has(nextStatus)) {
    throw new AppError('Estado no válido.', 400)
  }
  return updateFdcStallApplicationStatusRow(id, nextStatus)
}

export async function removeFdcStallApplication(id) {
  const ok = await deleteFdcStallApplicationRow(id)
  if (!ok) throw new AppError('Solicitud no encontrada.', 404)
}

export async function resendFdcStallConfirmationEmail(id) {
  const application = await findFdcStallApplicationById(id)
  if (!application) throw new AppError('Solicitud no encontrada.', 404)
  const result = await sendConfirmationEmail(application)
  const fresh = await findFdcStallApplicationById(id)
  if (!result.sent) {
    throw new AppError(
      result.reason === 'not_configured'
        ? 'El correo no está configurado en el servidor.'
        : result.reason || 'No se pudo reenviar el correo.',
      503,
    )
  }
  return fresh
}
