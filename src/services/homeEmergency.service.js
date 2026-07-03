import {
  getHomeEmergencyContentRow,
  upsertHomeEmergencyContentRow,
} from '../models/homeEmergency.model.js'
import { assertOptimisticLock } from '../utils/concurrency.js'

function cleanText(value, maxLen = 0) {
  const out = String(value || '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeToggle(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (value === 0 || value === '0' || value === 'false') return false
  if (value === 1 || value === '1' || value === 'true') return true
  return fallback
}

function sanitizeNumberItem(raw, index) {
  const id = cleanText(raw?.id, 60) || `emergencia-${index + 1}`
  const label = cleanText(raw?.label, 120)
  const phone = cleanText(raw?.phone, 40)
  const description = cleanText(raw?.description, 180)
  const isActive = normalizeToggle(raw?.isActive, true)
  const sortOrder = Math.max(0, Math.round(cleanNumber(raw?.sortOrder, index * 10)))

  if (!label && !phone) return null

  return {
    id,
    label,
    phone,
    description,
    isActive,
    sortOrder,
  }
}

function sanitizePayload(payload) {
  const numbers = Array.isArray(payload?.numbers)
    ? payload.numbers
        .map((item, idx) => sanitizeNumberItem(item, idx))
        .filter(Boolean)
        .slice(0, 40)
    : []

  return {
    eyebrow: cleanText(payload?.eyebrow, 80),
    title: cleanText(payload?.title, 160),
    subtitle: cleanText(payload?.subtitle, 500),
    imageUrl: cleanText(payload?.imageUrl, 2048),
    overlayOpacity: Math.min(90, Math.max(0, Math.round(cleanNumber(payload?.overlayOpacity, 65)))),
    showEyebrow: normalizeToggle(payload?.showEyebrow, true),
    showTitle: normalizeToggle(payload?.showTitle, true),
    showSubtitle: normalizeToggle(payload?.showSubtitle, true),
    numbers,
  }
}

export async function getHomeEmergencyContent() {
  return getHomeEmergencyContentRow()
}

export async function saveHomeEmergencyContent(payload) {
  const current = await getHomeEmergencyContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'números de emergencia',
    Boolean(payload?.forceOverwrite),
  )
  const data = sanitizePayload(payload)
  return upsertHomeEmergencyContentRow(data)
}
