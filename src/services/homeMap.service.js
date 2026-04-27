import { getHomeMapContentRow, upsertHomeMapContentRow } from '../models/homeMap.model.js'

const POINT_TYPES = new Set([
  'servicios',
  'salud',
  'turismo',
  'educacion',
  'transporte',
  'institucional',
  'otro',
])

function cleanText(value, maxLen = 0) {
  const out = String(value || '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function sanitizePoint(raw, index) {
  const id = cleanText(raw?.id, 60) || `punto-${index + 1}`
  const title = cleanText(raw?.title, 140)
  const subtitle = cleanText(raw?.subtitle, 120)
  const description = cleanText(raw?.description, 1200)
  const address = cleanText(raw?.address, 220)
  const pointTypeRaw = cleanText(raw?.pointType, 32).toLowerCase()
  const pointType = POINT_TYPES.has(pointTypeRaw) ? pointTypeRaw : 'otro'
  const lat = cleanNumber(raw?.lat, NaN)
  const lng = cleanNumber(raw?.lng, NaN)
  const isActive = raw?.isActive !== false
  const sortOrder = Math.max(0, Math.round(cleanNumber(raw?.sortOrder, index * 10)))

  if (!title && !subtitle && !description && !address) return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return {
    id,
    title,
    subtitle,
    description,
    address,
    pointType,
    lat,
    lng,
    isActive,
    sortOrder,
  }
}

function sanitizePayload(payload) {
  const points = Array.isArray(payload?.points)
    ? payload.points.map((point, idx) => sanitizePoint(point, idx)).filter(Boolean).slice(0, 120)
    : []

  return {
    center: {
      lat: cleanNumber(payload?.center?.lat, -26.2312),
      lng: cleanNumber(payload?.center?.lng, -65.2818),
    },
    zoom: Math.min(18, Math.max(10, Math.round(cleanNumber(payload?.zoom, 14)))),
    points,
  }
}

export async function getHomeMapContent() {
  return getHomeMapContentRow()
}

export async function saveHomeMapContent(payload) {
  const data = sanitizePayload(payload)
  return upsertHomeMapContentRow(data)
}
