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

function cleanBool(value, fallback = true) {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === '0' || v === 'false' || v === 'no') return false
    if (v === '1' || v === 'true' || v === 'yes') return true
  }
  return Boolean(value)
}

function cleanYear(value) {
  const y = Math.round(Number(value))
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null
  return y
}

function cleanCount(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(99999, n))
}

function cleanSortOrder(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function sanitizeProjectStat(item, index) {
  const year = cleanYear(item?.year)
  if (!year) return null
  const id = cleanString(item?.id, 90) || `proj-${Math.random().toString(36).slice(2, 9)}`
  return {
    id,
    sortOrder: cleanSortOrder(item?.sortOrder, (index + 1) * 10),
    year,
    count: cleanCount(item?.count),
  }
}

function sanitizePresentedProjects(input) {
  const raw = input && typeof input === 'object' ? input : {}
  const items = []
  for (const [index, item] of (Array.isArray(raw.items) ? raw.items : []).slice(0, 12).entries()) {
    const row = sanitizeProjectStat(item, index)
    if (row) items.push(row)
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder || a.year - b.year)
  return {
    enabled: cleanBool(raw.enabled, true),
    title: cleanString(raw.title, 220) || 'Proyectos presentados',
    subtitle: cleanMultiline(raw.subtitle, 600),
    items,
  }
}

function sanitizeCommission(item, index) {
  const name = cleanString(item?.name, 240)
  if (!name) return null
  const id = cleanString(item?.id, 90) || `com-${Math.random().toString(36).slice(2, 9)}`
  return {
    id,
    sortOrder: cleanSortOrder(item?.sortOrder, (index + 1) * 10),
    number: cleanString(item?.number, 12) || String(index + 1),
    name,
    roleLabel: cleanString(item?.roleLabel, 80) || 'Miembro',
    roleHolder: cleanString(item?.roleHolder, 200),
    competencies: cleanMultiline(item?.competencies, 2500),
  }
}

function sanitizeCommissions(input) {
  const raw = input && typeof input === 'object' ? input : {}
  const items = []
  for (const [index, item] of (Array.isArray(raw.items) ? raw.items : []).slice(0, 24).entries()) {
    const row = sanitizeCommission(item, index)
    if (row) items.push(row)
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    enabled: cleanBool(raw.enabled, true),
    title: cleanString(raw.title, 240) || 'Comisiones que integra el legislador',
    subtitle: cleanMultiline(raw.subtitle, 800),
    items,
  }
}

function sanitizeLaw(item, index) {
  const number = cleanString(item?.number, 40)
  const body = cleanMultiline(item?.body ?? item?.description, 4000)
  if (!number && !body) return null
  const lawNumber = number || String(index + 1)
  const id = cleanString(item?.id, 90) || `law-${Math.random().toString(36).slice(2, 9)}`
  return {
    id,
    sortOrder: cleanSortOrder(item?.sortOrder, (index + 1) * 10),
    number: lawNumber,
    label: cleanString(item?.label, 120) || `LEY ${lawNumber}`,
    body,
  }
}

function sanitizeLaws(input) {
  const raw = input && typeof input === 'object' ? input : {}
  const items = []
  for (const [index, item] of (Array.isArray(raw.items) ? raw.items : []).slice(0, 80).entries()) {
    const row = sanitizeLaw(item, index)
    if (row) items.push(row)
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    enabled: cleanBool(raw.enabled, true),
    title: cleanString(raw.title, 180) || 'Leyes',
    subtitle: cleanMultiline(raw.subtitle, 800),
    items,
  }
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
    showLegislatorPhoto: cleanBool(payload?.showLegislatorPhoto, true),
    showLegislatorRole: cleanBool(payload?.showLegislatorRole, true),
    showLegislatorBio: cleanBool(payload?.showLegislatorBio, true),
    showContactPanel: cleanBool(payload?.showContactPanel, true),
    showContactEmail: cleanBool(payload?.showContactEmail, true),
    showContactPhone: cleanBool(payload?.showContactPhone, true),
    showOfficeHours: cleanBool(payload?.showOfficeHours, true),
    showContactNote: cleanBool(payload?.showContactNote, true),
    presentedProjects: sanitizePresentedProjects(payload?.presentedProjects),
    commissions: sanitizeCommissions(payload?.commissions),
    laws: sanitizeLaws(payload?.laws),
    showPresentedProjects: cleanBool(payload?.showPresentedProjects, true),
    showCommissions: cleanBool(payload?.showCommissions, true),
    showLaws: cleanBool(payload?.showLaws, true),
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
    Boolean(payload?.forceOverwrite),
  )
  const data = sanitizePayload(payload)
  return upsertLegisladorEsteContentRow(data)
}
