import {
  getLegisladorEsteContentRow,
  upsertLegisladorEsteContentRow,
} from '../models/legisladorEste.model.js'
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

function sanitizePayload(payload) {
  return {
    heroEyebrow: cleanString(payload?.heroEyebrow, 120),
    heroTitle: cleanString(payload?.heroTitle, 180),
    heroSubtitle: cleanMultiline(payload?.heroSubtitle, 1200),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    legislatorName: cleanString(payload?.legislatorName, 140),
    legislatorRole: cleanString(payload?.legislatorRole, 180),
    legislatorBio: cleanMultiline(payload?.legislatorBio, 2500),
    legislatorPhotoUrl: cleanUrl(payload?.legislatorPhotoUrl, 2048),
    contactEmail: cleanString(payload?.contactEmail, 180).toLowerCase(),
    contactPhone: cleanString(payload?.contactPhone, 80),
    officeHours: cleanString(payload?.officeHours, 140),
  }
}

export async function getLegisladorEsteContent() {
  return getLegisladorEsteContentRow()
}

export async function saveLegisladorEsteContent(payload) {
  const current = await getLegisladorEsteContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'contenido de legislador por el este',
  )
  const data = sanitizePayload(payload)
  return upsertLegisladorEsteContentRow(data)
}
