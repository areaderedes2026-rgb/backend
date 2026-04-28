import {
  createEventRow,
  deleteEventRow,
  findEventByIdRow,
  findEventBySlugRow,
  listEventsRows,
  updateEventRow,
} from '../models/event.model.js'
import { AppError } from '../utils/AppError.js'
import { slugify } from '../utils/slugify.js'

function cleanText(value, maxLen = 0) {
  const out = String(value || '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanUrl(value, maxLen = 2048) {
  const out = cleanText(value, maxLen)
  if (!out) return ''
  if (out.startsWith('http://') || out.startsWith('https://') || out.startsWith('/')) return out
  return ''
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let candidate = baseSlug
  let n = 1
  while (true) {
    const found = await findEventBySlugRow(candidate)
    if (!found || Number(found.id) === Number(excludeId)) return candidate
    candidate = `${baseSlug}-${n}`
    n += 1
  }
}

function sanitizePayload(payload) {
  const title = cleanText(payload?.title, 180)
  const place = cleanText(payload?.place, 180)
  const summary = cleanText(payload?.summary, 1000)
  const flyerUrl = cleanUrl(payload?.flyerUrl, 2048)
  const sortOrder = Math.max(0, Math.round(Number(payload?.sortOrder) || 0))
  const isActive = payload?.isActive !== false
  const rawDate = payload?.eventDate ? new Date(payload.eventDate) : null

  if (!title) throw new AppError('El título del evento es obligatorio.', 400)
  if (!place) throw new AppError('El lugar del evento es obligatorio.', 400)
  if (!flyerUrl) throw new AppError('La imagen/flyer es obligatoria.', 400)
  if (!rawDate || Number.isNaN(rawDate.getTime())) {
    throw new AppError('La fecha del evento es inválida.', 400)
  }

  return {
    title,
    place,
    summary,
    flyerUrl,
    sortOrder,
    isActive,
    eventDate: rawDate,
    slug: cleanText(payload?.slug, 220),
  }
}

export async function listPublicEvents() {
  return listEventsRows({ onlyActive: true })
}

export async function listAdminEvents() {
  return listEventsRows({ onlyActive: false })
}

export async function createEvent(payload) {
  const data = sanitizePayload(payload)
  const baseSlug = data.slug || slugify(data.title)
  data.slug = await ensureUniqueSlug(baseSlug)
  return createEventRow(data)
}

export async function updateEvent(id, payload) {
  const existing = await findEventByIdRow(Number(id))
  if (!existing) throw new AppError('Evento no encontrado.', 404)
  const data = sanitizePayload(payload)
  const baseSlug = data.slug || slugify(data.title)
  data.slug = await ensureUniqueSlug(baseSlug, Number(id))
  return updateEventRow(Number(id), data)
}

export async function removeEvent(id) {
  const ok = await deleteEventRow(Number(id))
  if (!ok) throw new AppError('Evento no encontrado.', 404)
}
