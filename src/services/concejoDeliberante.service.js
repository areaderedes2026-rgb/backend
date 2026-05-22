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

function cleanSortOrder(value, fallback = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return Math.max(0, Math.round(fallback))
  return Math.max(0, Math.round(n))
}

function sanitizeMember(item, index = 0) {
  const id = cleanString(item?.id, 90) || uniqueId('concejal')
  const name = cleanString(item?.name, 180)
  if (!name) return null
  const sortOrder =
    item?.sortOrder == null || item?.sortOrder === ''
      ? (index + 1) * 10
      : cleanSortOrder(item.sortOrder, (index + 1) * 10)
  return {
    id,
    name,
    role: cleanString(item?.role, 180),
    photoUrl: cleanUrl(item?.photoUrl, 2048),
    bio: cleanMultiline(item?.bio, 1500),
    email: cleanString(item?.email, 180).toLowerCase(),
    phone: cleanString(item?.phone, 80),
    period: cleanString(item?.period, 80),
    sortOrder,
  }
}

function cleanSortOrderMain(value, fallback = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return Math.max(0, Math.round(fallback))
  return Math.max(0, Math.round(n))
}

function sanitizeLines(input, maxItems = 24, maxLen = 2000) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const line of raw.slice(0, maxItems)) {
    const s = cleanMultiline(line, maxLen)
    if (s) out.push(s)
  }
  return out
}

function sanitizeListGroup(item, index = 0) {
  if (!item || typeof item !== 'object') return null
  const title = cleanString(item.title, 220)
  const items = sanitizeLines(item.items, 20, 1200)
  if (!title && !items.length) return null
  return {
    id: cleanString(item.id, 90) || uniqueId('list'),
    sortOrder:
      item?.sortOrder == null || item?.sortOrder === ''
        ? (index + 1) * 10
        : cleanSortOrderMain(item.sortOrder, (index + 1) * 10),
    title,
    items,
  }
}

function sanitizeExamples(item) {
  if (!item || typeof item !== 'object') return null
  const title = cleanString(item.title, 120) || 'Ejemplos'
  const items = sanitizeLines(item.items, 16, 1200)
  if (!items.length) return null
  return { title, items }
}

function sanitizeSubsection(item, index = 0) {
  if (!item || typeof item !== 'object') return null
  const title = cleanString(item.title, 220)
  const paragraphs = sanitizeLines(item.paragraphs, 12, 2500)
  const listGroups = (Array.isArray(item.listGroups) ? item.listGroups : [])
    .map((g, idx) => sanitizeListGroup(g, idx))
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const examples = sanitizeExamples(item.examples)
  if (!title && !paragraphs.length && !listGroups.length && !examples) return null
  return {
    id: cleanString(item.id, 90) || uniqueId('sub'),
    sortOrder:
      item?.sortOrder == null || item?.sortOrder === ''
        ? (index + 1) * 10
        : cleanSortOrderMain(item.sortOrder, (index + 1) * 10),
    title,
    paragraphs,
    listGroups,
    examples,
  }
}

function sanitizeFunctionSection(item, index = 0) {
  if (!item || typeof item !== 'object') return null
  const title = cleanString(item.title, 220)
  const number = cleanString(item.number, 12)
  const paragraphs = sanitizeLines(item.paragraphs, 16, 2500)
  const subsections = (Array.isArray(item.subsections) ? item.subsections : [])
    .map((s, idx) => sanitizeSubsection(s, idx))
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  if (!title && !paragraphs.length && !subsections.length) return null
  return {
    id: cleanString(item.id, 90) || uniqueId('func'),
    sortOrder:
      item?.sortOrder == null || item?.sortOrder === ''
        ? (index + 1) * 10
        : cleanSortOrderMain(item.sortOrder, (index + 1) * 10),
    number,
    title,
    paragraphs,
    subsections,
  }
}

function sanitizeMainFunctions(input) {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const sections = (Array.isArray(raw.sections) ? raw.sections : [])
    .slice(0, 12)
    .map((s, idx) => sanitizeFunctionSection(s, idx))
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    enabled: raw.enabled !== false,
    title: cleanString(raw.title, 220) || 'Funciones principales del HCD',
    sections,
  }
}

function sanitizeRoleHolder(item) {
  if (!item || typeof item !== 'object') return { name: '', role: '' }
  return {
    name: cleanString(item.name, 160),
    role: cleanString(item.role, 180),
  }
}

function sanitizeCommission(item, index = 0) {
  if (!item || typeof item !== 'object') return null
  const name = cleanString(item.name, 220)
  if (!name) return null
  const kind = item.kind === 'coordinating' ? 'coordinating' : 'standard'
  return {
    id: cleanString(item.id, 90) || uniqueId('com'),
    sortOrder:
      item?.sortOrder == null || item?.sortOrder === ''
        ? (index + 1) * 10
        : cleanSortOrderMain(item.sortOrder, (index + 1) * 10),
    number: cleanString(item.number, 12) || String(index + 1),
    name,
    kind,
    presidente: sanitizeRoleHolder(item.presidente),
    vocal1: kind === 'standard' ? sanitizeRoleHolder(item.vocal1) : { name: '', role: '' },
    vocal2: kind === 'standard' ? sanitizeRoleHolder(item.vocal2) : { name: '', role: '' },
  }
}

function sanitizeCommissions(input) {
  const raw = input && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .slice(0, 20)
    .map((c, idx) => sanitizeCommission(c, idx))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      const na = Number(a.number)
      const nb = Number(b.number)
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    })
  return {
    enabled: raw.enabled !== false,
    title: cleanString(raw.title, 220) || 'Comisiones de Trabajo',
    subtitle: cleanMultiline(raw.subtitle, 800),
    items,
  }
}

function sanitizeMembers(input) {
  const raw = Array.isArray(input) ? input : []
  const seen = new Set()
  const out = []
  for (const [idx, it] of raw.slice(0, 50).entries()) {
    const m = sanitizeMember(it, idx)
    if (!m) continue
    if (seen.has(m.id)) m.id = uniqueId('concejal')
    seen.add(m.id)
    out.push(m)
  }
  return out.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  })
}

function sanitizePayload(payload) {
  return {
    heroEyebrow: cleanString(payload?.heroEyebrow, 180),
    heroTitle: cleanString(payload?.heroTitle, 220),
    heroSubtitle: cleanMultiline(payload?.heroSubtitle, 2000),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    introTitle: cleanString(payload?.introTitle, 220),
    introLogoUrl: cleanUrl(payload?.introLogoUrl, 2048),
    introParagraphs: sanitizeParagraphs(payload?.introParagraphs),
    presidentName: cleanString(payload?.presidentName, 160),
    presidentRole: cleanString(payload?.presidentRole, 180),
    presidentBio: cleanMultiline(payload?.presidentBio, 2000),
    presidentPhotoUrl: cleanUrl(payload?.presidentPhotoUrl, 2048),
    sessionsTitle: cleanString(payload?.sessionsTitle, 220),
    sessionsSchedule: cleanString(payload?.sessionsSchedule, 220),
    sessionsLocation: cleanString(payload?.sessionsLocation, 280),
    sessionsNote: cleanMultiline(payload?.sessionsNote, 1200),
    commissionsSchedule: cleanString(payload?.commissionsSchedule, 280),
    contactSectionTitle: cleanString(payload?.contactSectionTitle, 220),
    contactSectionSubtitle: cleanString(payload?.contactSectionSubtitle, 500),
    contactEmail: cleanString(payload?.contactEmail, 180).toLowerCase(),
    contactPhone: cleanString(payload?.contactPhone, 80),
    contactAddress: cleanString(payload?.contactAddress, 280),
    contactHours: cleanString(payload?.contactHours, 180),
    mainFunctions: sanitizeMainFunctions(payload?.mainFunctions ?? payload?.blocks),
    members: sanitizeMembers(payload?.members),
    commissions: sanitizeCommissions(payload?.commissions),
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
