import {
  createCitizenInquiryRow,
  deleteCitizenInquiryRow,
  findCitizenInquiryByIdRow,
  getCitizenAttentionContentRow,
  listCitizenInquiriesRows,
  updateCitizenInquiryStatusRow,
  upsertCitizenAttentionContentRow,
} from '../models/citizenAttention.model.js'
import { AppError } from '../utils/AppError.js'

const ALLOWED_ICONS = new Set(['building', 'phone', 'mail', 'share'])
const ALLOWED_STATUSES = new Set(['sin_resolver', 'leida', 'resuelta'])

function cleanString(value, maxLen = 0) {
  const out = String(value || '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanMultiline(value, maxLen = 0) {
  const out = String(value || '').replace(/\r\n/g, '\n').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanUrl(value, maxLen = 2048) {
  const out = cleanString(value, maxLen)
  if (!out) return ''
  if (out.startsWith('http://') || out.startsWith('https://') || out.startsWith('/')) {
    return out
  }
  return ''
}

function cleanSlug(value, maxLen = 40) {
  return cleanString(value, maxLen)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
}

function cleanList(list, mapper, maxItems = 40) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const item of list.slice(0, maxItems)) {
    const mapped = mapper(item)
    if (mapped) out.push(mapped)
  }
  return out
}

function sanitizeContentPayload(payload) {
  return {
    heroEyebrow: cleanString(payload?.heroEyebrow, 120),
    heroTitle: cleanString(payload?.heroTitle, 180),
    heroSubtitle: cleanMultiline(payload?.heroSubtitle, 1600),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    channels: cleanList(
      payload?.channels,
      (item, idx) => {
        const id = cleanSlug(item?.id || `canal-${idx + 1}`, 40)
        const title = cleanString(item?.title, 140)
        const subtitle = cleanString(item?.subtitle, 140)
        const description = cleanMultiline(item?.description, 1400)
        const accent = cleanString(item?.accent, 80) || 'from-sky-600 to-cyan-600'
        const icon = cleanString(item?.icon, 20)
        if (!title && !subtitle && !description) return null
        return {
          id: id || `canal-${Date.now().toString(36)}`,
          title,
          subtitle,
          description,
          accent,
          icon: ALLOWED_ICONS.has(icon) ? icon : 'mail',
        }
      },
      12,
    ),
    faq: cleanList(
      payload?.faq,
      (item, idx) => {
        const id = cleanSlug(item?.id || `faq-${idx + 1}`, 40)
        const q = cleanString(item?.q, 240)
        const a = cleanMultiline(item?.a, 2400)
        if (!q && !a) return null
        return {
          id: id || `faq-${Date.now().toString(36)}`,
          q,
          a,
        }
      },
      30,
    ),
    tips: cleanList(
      payload?.tips,
      (item) => {
        const text = cleanString(item, 320)
        return text || null
      },
      10,
    ),
    formTopics: cleanList(
      payload?.formTopics,
      (item, idx) => {
        const value = cleanSlug(item?.value, 40)
        const label = cleanString(item?.label, 90)
        if (!value && !label) return null
        return {
          value: value || `tema-${idx + 1}`,
          label: label || value,
        }
      },
      20,
    ),
    formIntroText: cleanMultiline(payload?.formIntroText, 700),
    finalCtaTitle: cleanString(payload?.finalCtaTitle, 180),
    finalCtaText: cleanMultiline(payload?.finalCtaText, 1200),
    finalPrimaryLabel: cleanString(payload?.finalPrimaryLabel, 80),
    finalPrimaryHref: cleanUrl(payload?.finalPrimaryHref, 2048),
    finalSecondaryLabel: cleanString(payload?.finalSecondaryLabel, 80),
    finalSecondaryHref: cleanUrl(payload?.finalSecondaryHref, 2048),
  }
}

function sanitizeInquiryPayload(payload) {
  const firstName = cleanString(payload?.firstName, 120)
  const lastName = cleanString(payload?.lastName, 120)
  const dni = cleanString(payload?.dni, 20).replace(/[^\d]/g, '')
  const email = cleanString(payload?.email, 180).toLowerCase()
  const phone = cleanString(payload?.phone, 80)
  const topic = cleanString(payload?.topic, 40).toLowerCase()
  const message = cleanMultiline(payload?.message, 5000)

  if (!firstName) throw new AppError('El nombre es obligatorio.', 400)
  if (!lastName) throw new AppError('El apellido es obligatorio.', 400)
  if (!dni || dni.length < 7 || dni.length > 10) {
    throw new AppError('El DNI es obligatorio y debe ser válido.', 400)
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('El correo electrónico no es válido.', 400)
  }
  if (!topic) throw new AppError('El tema de la consulta es obligatorio.', 400)
  if (!message || message.length < 12) {
    throw new AppError('El mensaje debe tener al menos 12 caracteres.', 400)
  }

  return {
    firstName,
    lastName,
    dni,
    email,
    phone,
    topic,
    message,
    status: 'sin_resolver',
  }
}

export async function getCitizenAttentionContent() {
  return getCitizenAttentionContentRow()
}

export async function saveCitizenAttentionContent(payload) {
  const data = sanitizeContentPayload(payload)
  return upsertCitizenAttentionContentRow(data)
}

export async function createCitizenInquiry(payload) {
  const data = sanitizeInquiryPayload(payload)
  return createCitizenInquiryRow(data)
}

export async function listCitizenInquiriesAdmin({ status = '' } = {}) {
  const value = cleanString(status, 24).toLowerCase()
  const safeStatus = ALLOWED_STATUSES.has(value) ? value : ''
  return listCitizenInquiriesRows({ status: safeStatus, limit: 250 })
}

export async function getCitizenInquiryAdmin(id) {
  const item = await findCitizenInquiryByIdRow(Number(id))
  if (!item) throw new AppError('Consulta no encontrada.', 404)
  return item
}

export async function setCitizenInquiryStatus(id, nextStatus) {
  const status = cleanString(nextStatus, 24).toLowerCase()
  if (!ALLOWED_STATUSES.has(status)) {
    throw new AppError('Estado inválido.', 400)
  }
  const existing = await findCitizenInquiryByIdRow(Number(id))
  if (!existing) throw new AppError('Consulta no encontrada.', 404)
  return updateCitizenInquiryStatusRow(existing.id, status)
}

export async function removeCitizenInquiry(id) {
  const ok = await deleteCitizenInquiryRow(Number(id))
  if (!ok) throw new AppError('Consulta no encontrada.', 404)
  return true
}
