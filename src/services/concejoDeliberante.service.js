import {
  getConcejoDeliberanteContentRow,
  upsertConcejoDeliberanteContentRow,
} from '../models/concejoDeliberante.model.js'
import { assertOptimisticLock } from '../utils/concurrency.js'

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

function uniqueId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function sanitizeParagraphs(input) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const p of raw.slice(0, 6)) {
    const s = cleanMultiline(p, 1500)
    if (s) out.push(s)
  }
  return out
}

function sanitizeMember(item) {
  const id = cleanString(item?.id, 90) || uniqueId('concejal')
  const name = cleanString(item?.name, 180)
  if (!name) return null
  return {
    id,
    name,
    role: cleanString(item?.role, 180),
    photoUrl: cleanUrl(item?.photoUrl, 2048),
    bio: cleanMultiline(item?.bio, 1500),
    email: cleanString(item?.email, 180).toLowerCase(),
    phone: cleanString(item?.phone, 80),
    period: cleanString(item?.period, 80),
  }
}

function sanitizeMembers(input) {
  const raw = Array.isArray(input) ? input : []
  const seen = new Set()
  const out = []
  for (const it of raw.slice(0, 50)) {
    const m = sanitizeMember(it)
    if (!m) continue
    if (seen.has(m.id)) m.id = uniqueId('concejal')
    seen.add(m.id)
    out.push(m)
  }
  return out
}

function sanitizePayload(payload) {
  return {
    heroEyebrow: cleanString(payload?.heroEyebrow, 180),
    heroTitle: cleanString(payload?.heroTitle, 220),
    heroSubtitle: cleanMultiline(payload?.heroSubtitle, 2000),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    introTitle: cleanString(payload?.introTitle, 220),
    introParagraphs: sanitizeParagraphs(payload?.introParagraphs),
    presidentName: cleanString(payload?.presidentName, 160),
    presidentRole: cleanString(payload?.presidentRole, 180),
    presidentBio: cleanMultiline(payload?.presidentBio, 2000),
    presidentPhotoUrl: cleanUrl(payload?.presidentPhotoUrl, 2048),
    sessionsTitle: cleanString(payload?.sessionsTitle, 220),
    sessionsSchedule: cleanString(payload?.sessionsSchedule, 220),
    sessionsLocation: cleanString(payload?.sessionsLocation, 280),
    sessionsNote: cleanMultiline(payload?.sessionsNote, 1200),
    contactEmail: cleanString(payload?.contactEmail, 180).toLowerCase(),
    contactPhone: cleanString(payload?.contactPhone, 80),
    contactAddress: cleanString(payload?.contactAddress, 280),
    contactHours: cleanString(payload?.contactHours, 180),
    blocks: [],
    members: sanitizeMembers(payload?.members),
    commissions: [],
  }
}

export async function getConcejoDeliberanteContent() {
  return getConcejoDeliberanteContentRow()
}

export async function saveConcejoDeliberanteContent(payload) {
  const current = await getConcejoDeliberanteContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'contenido de concejo deliberante',
  )
  const data = sanitizePayload(payload)
  return upsertConcejoDeliberanteContentRow(data)
}
