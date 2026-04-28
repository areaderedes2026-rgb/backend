import {
  getIntendenciaContentRow,
  upsertIntendenciaContentRow,
} from '../models/intendencia.model.js'

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
    mayorName: cleanString(payload?.mayorName, 140),
    mayorRole: cleanString(payload?.mayorRole, 180),
    mayorBio: cleanMultiline(payload?.mayorBio, 2500),
    mayorPhotoUrl: cleanUrl(payload?.mayorPhotoUrl, 2048),
    contactEmail: cleanString(payload?.contactEmail, 180).toLowerCase(),
    contactPhone: cleanString(payload?.contactPhone, 80),
    officeHours: cleanString(payload?.officeHours, 140),
  }
}

export async function getIntendenciaContent() {
  return getIntendenciaContentRow()
}

export async function saveIntendenciaContent(payload) {
  const data = sanitizePayload(payload)
  return upsertIntendenciaContentRow(data)
}
