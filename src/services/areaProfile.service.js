import { findAreaProfileBySlug, upsertAreaProfileBySlug } from '../models/areaProfile.model.js'
import { findAreaBySlug } from '../models/area.model.js'
import { AppError } from '../utils/AppError.js'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function cleanString(value, maxLen = 0) {
  const v = String(value || '').trim()
  if (!maxLen) return v
  return v.slice(0, maxLen)
}

function cleanUrl(value, maxLen = 2048) {
  const v = cleanString(value, maxLen)
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  return ''
}

function sanitizeItems(list, mapper, maxItems = 20) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const item of list.slice(0, maxItems)) {
    const mapped = mapper(item)
    if (mapped) out.push(mapped)
  }
  return out
}

function slugFromSchoolName(name, idx) {
  const s = cleanString(name, 120)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return s || `escuela-${idx}`
}

function sanitizeSchoolsSection(input) {
  if (input === null) return null
  if (!input || typeof input !== 'object') return null
  const rawItems = Array.isArray(input.items) ? input.items : []
  const items = []
  for (let idx = 0; idx < rawItems.length && items.length < 24; idx++) {
    const item = rawItems[idx]
    const name = cleanString(item?.name, 200)
    const discipline = cleanString(item?.discipline, 100)
    const schedule = cleanString(item?.schedule, 500)
    const venue = cleanString(item?.venue, 280)
    const description = cleanString(item?.description, 2400)
    const imageUrl = cleanUrl(item?.imageUrl, 2048)
    let id = cleanString(item?.id, 100)
    if (!id) id = slugFromSchoolName(name, idx)
    if (!name && !description) continue
    items.push({
      id,
      name,
      discipline,
      schedule,
      venue,
      description,
      imageUrl,
    })
  }
  if (!items.length) return null
  return {
    navLabel: cleanString(input.navLabel, 80) || 'Escuelas',
    eyebrow: cleanString(input.eyebrow, 120),
    title: cleanString(input.title, 200),
    intro: cleanString(input.intro, 3200),
    items,
  }
}

function sanitizePayload(payload) {
  const directorIn = payload?.director || {}
  const locationIn = payload?.location || {}

  return {
    heroTag: cleanString(payload?.heroTag, 140),
    mission: cleanString(payload?.mission, 3000),
    director: {
      name: cleanString(directorIn.name, 140),
      role: cleanString(directorIn.role, 160),
      bio: cleanString(directorIn.bio, 3000),
      photoUrl: cleanUrl(directorIn.photoUrl, 2048),
      email: cleanString(directorIn.email, 180),
      phone: cleanString(directorIn.phone, 80),
      officeHours: cleanString(directorIn.officeHours, 140),
    },
    serviceBlocks: sanitizeItems(
      payload?.serviceBlocks,
      (item) => {
        const title = cleanString(item?.title, 180)
        const description = cleanString(item?.description, 2200)
        const mode = cleanString(item?.mode, 140)
        if (!title && !description && !mode) return null
        return { title, description, mode }
      },
      30,
    ),
    initiatives: sanitizeItems(
      payload?.initiatives,
      (item) => {
        const title = cleanString(item?.title, 180)
        const description = cleanString(item?.description, 2200)
        if (!title && !description) return null
        return { title, description }
      },
      30,
    ),
    contactCards: sanitizeItems(
      payload?.contactCards,
      (item) => {
        const label = cleanString(item?.label, 120)
        const value = cleanString(item?.value, 220)
        const note = cleanString(item?.note, 240)
        if (!label && !value && !note) return null
        return { label, value, note }
      },
      20,
    ),
    notices: sanitizeItems(
      payload?.notices,
      (item) => {
        const value = cleanString(item, 400)
        return value || null
      },
      40,
    ),
    location: {
      address: cleanString(locationIn.address, 240),
      references: cleanString(locationIn.references, 280),
      mapEmbedUrl: cleanUrl(locationIn.mapEmbedUrl, 2048),
      mapExternalUrl: cleanUrl(locationIn.mapExternalUrl, 2048),
    },
    schoolsSection: sanitizeSchoolsSection(payload?.schoolsSection),
  }
}

function assertValidSlug(slug) {
  const s = cleanString(slug, 90)
  if (!s || !SLUG_RE.test(s)) {
    throw new AppError('Slug de área inválido.', 400)
  }
  return s
}

export async function getAreaProfile(slug) {
  const validSlug = assertValidSlug(slug)
  const area = await findAreaBySlug(validSlug, { includeInactive: true })
  if (!area) throw new AppError('Área no encontrada.', 404)
  return findAreaProfileBySlug(validSlug)
}

export async function saveAreaProfile(slug, payload) {
  const validSlug = assertValidSlug(slug)
  const area = await findAreaBySlug(validSlug, { includeInactive: true })
  if (!area) throw new AppError('Área no encontrada.', 404)
  const data = sanitizePayload(payload)
  return upsertAreaProfileBySlug(validSlug, data)
}
