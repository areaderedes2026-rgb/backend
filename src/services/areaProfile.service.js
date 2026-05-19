import { randomUUID } from 'node:crypto'
import { findAreaProfileBySlug, upsertAreaProfileBySlug } from '../models/areaProfile.model.js'
import { findAreaBySlug } from '../models/area.model.js'
import {
  listAreaServicePermissionsForUser,
  userHasAreaServicePermission,
} from '../models/userResourcePermission.model.js'
import { AppError } from '../utils/AppError.js'
import { assertOptimisticLock } from '../utils/concurrency.js'

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

function cleanServiceId(raw) {
  const id = cleanString(raw, 120)
  if (!id) return ''
  return /^[a-zA-Z0-9_.-]+$/.test(id) ? id : ''
}

function sanitizeServiceItem(item) {
  const title = cleanString(item?.title, 180)
  const description = cleanString(item?.description, 2200)
  const mode = cleanString(item?.mode, 140)
  const imageUrl = cleanUrl(item?.imageUrl, 2048)
  const personInCharge = cleanString(item?.personInCharge, 200)
  const generalObjective = cleanString(item?.generalObjective, 3000)
  let id = cleanServiceId(item?.id)
  if (!id) id = randomUUID()
  if (!title && !description && !mode && !imageUrl && !personInCharge && !generalObjective) {
    return null
  }
  return {
    id,
    title,
    description,
    mode,
    imageUrl,
    personInCharge,
    generalObjective,
  }
}

function sanitizeServiceUpdate(item, current) {
  const merged = {
    ...current,
    ...item,
    id: current.id,
  }
  const next = sanitizeServiceItem(merged)
  if (!next) {
    throw new AppError('El servicio no puede quedar vacío.', 400)
  }
  next.id = current.id
  return next
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
      email: '',
      phone: '',
      officeHours: '',
    },
    serviceBlocks: sanitizeItems(payload?.serviceBlocks, sanitizeServiceItem, 30),
    initiatives: [],
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
  const current = await findAreaProfileBySlug(validSlug)
  assertOptimisticLock(payload?.expectedUpdatedAt, current?.updatedAt, 'perfil del área')
  const data = sanitizePayload(payload)
  return upsertAreaProfileBySlug(validSlug, data)
}

async function assertAreaServiceAccess(user, areaSlug, serviceId) {
  if (!user) throw new AppError('No autorizado.', 401)
  if (user.role === 'admin' || user.role === 'editor') return
  if (user.role !== 'area_service_editor') {
    throw new AppError('No tenés permiso para esta acción.', 403)
  }
  const ok = await userHasAreaServicePermission(user.id, areaSlug, serviceId)
  if (!ok) throw new AppError('No tenés permiso para editar este servicio.', 403)
}

function findServiceInProfile(profile, serviceId) {
  const id = cleanServiceId(serviceId)
  if (!id) throw new AppError('Servicio inválido.', 400)
  const service = (profile?.serviceBlocks || []).find((item) => String(item?.id || '') === id)
  if (!service) throw new AppError('Servicio no encontrado.', 404)
  return service
}

export async function getAreaProfileService(slug, serviceId, user) {
  const validSlug = assertValidSlug(slug)
  const area = await findAreaBySlug(validSlug, { includeInactive: true })
  if (!area) throw new AppError('Área no encontrada.', 404)
  await assertAreaServiceAccess(user, validSlug, serviceId)
  const profile = await findAreaProfileBySlug(validSlug)
  if (!profile) throw new AppError('Perfil del área no encontrado.', 404)
  const service = findServiceInProfile(profile, serviceId)
  return {
    area: {
      slug: validSlug,
      title: area.title || validSlug,
    },
    service,
    updatedAt: profile.updatedAt,
  }
}

export async function saveAreaProfileService(slug, serviceId, payload, user) {
  const validSlug = assertValidSlug(slug)
  const area = await findAreaBySlug(validSlug, { includeInactive: true })
  if (!area) throw new AppError('Área no encontrada.', 404)
  await assertAreaServiceAccess(user, validSlug, serviceId)
  const current = await findAreaProfileBySlug(validSlug)
  if (!current) throw new AppError('Perfil del área no encontrado.', 404)
  assertOptimisticLock(payload?.expectedUpdatedAt, current.updatedAt, 'servicio del área')
  const currentService = findServiceInProfile(current, serviceId)
  const nextService = sanitizeServiceUpdate(payload?.service || payload || {}, currentService)
  const nextProfile = {
    ...current,
    serviceBlocks: current.serviceBlocks.map((item) =>
      String(item?.id || '') === String(serviceId) ? nextService : item,
    ),
  }
  const saved = await upsertAreaProfileBySlug(validSlug, nextProfile)
  const service = findServiceInProfile(saved, serviceId)
  return {
    area: {
      slug: validSlug,
      title: area.title || validSlug,
    },
    service,
    updatedAt: saved.updatedAt,
  }
}

export async function listMyAreaProfileServices(user) {
  if (!user) throw new AppError('No autorizado.', 401)
  if (user.role === 'admin' || user.role === 'editor') return []
  const permissions = await listAreaServicePermissionsForUser(user.id)
  const out = []
  for (const permission of permissions) {
    const area = await findAreaBySlug(permission.areaSlug, { includeInactive: true })
    const profile = await findAreaProfileBySlug(permission.areaSlug)
    const service = (profile?.serviceBlocks || []).find(
      (item) => String(item?.id || '') === permission.resourceId,
    )
    if (!area || !service) continue
    out.push({
      area: {
        slug: permission.areaSlug,
        title: area.title || permission.areaSlug,
      },
      service,
      updatedAt: profile.updatedAt,
    })
  }
  return out
}
