import { findAreaBySlug } from '../models/area.model.js'
import {
  countOfficesBySlugPair,
  createAreaOfficeRow,
  deleteAreaOfficeRow,
  findAreaOfficeByAreaAndSlug,
  findAreaOfficeByAreaSlugAndId,
  listAreaOfficesByAreaSlug,
  updateAreaOfficeRow,
} from '../models/areaOffice.model.js'
import { slugify } from '../utils/slugify.js'
import { AppError } from '../utils/AppError.js'

const ALLOWED_ICONS = new Set([
  'building',
  'users',
  'heart',
  'clipboard',
  'bookOpen',
  'handHeart',
  'mapPin',
  'shield',
  'sparkles',
])

const RESERVED_OFFICE_SLUGS = new Set(['admin'])

function cleanString(value, max) {
  return String(value || '')
    .trim()
    .slice(0, max)
}

function cleanOfficeSlug(value) {
  const s = slugify(String(value || '').trim()).slice(0, 90)
  return s
}

function cleanActivities(list) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const item of list.slice(0, 80)) {
    const line = String(item == null ? '' : item).trim().slice(0, 500)
    if (line) out.push(line)
  }
  return out
}

async function ensureUniqueOfficeSlug(areaSlug, base, excludeId = null) {
  let candidate = base || 'oficina'
  let n = 0
  while (true) {
    const count = await countOfficesBySlugPair(areaSlug, candidate, excludeId)
    if (count === 0 && !RESERVED_OFFICE_SLUGS.has(candidate)) return candidate
    n += 1
    candidate = `${base || 'oficina'}-${n}`
  }
}

async function assertAreaExistsForStaff(slug) {
  const area = await findAreaBySlug(String(slug || '').trim(), { includeInactive: true })
  if (!area) throw new AppError('Área no encontrada.', 404)
  return area
}

async function assertAreaPublic(slug) {
  const area = await findAreaBySlug(String(slug || '').trim(), { includeInactive: false })
  if (!area) throw new AppError('Área no encontrada.', 404)
  return area
}

function mapPublicSummary(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.officeSlug,
    name: row.name,
    iconKey: row.iconKey,
    sortOrder: row.sortOrder,
  }
}

function mapPublicDetail(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.officeSlug,
    name: row.name,
    iconKey: row.iconKey,
    description: row.description,
    activities: row.activities,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt,
  }
}

function mapAdminRow(row) {
  if (!row) return null
  return {
    id: row.id,
    areaSlug: row.areaSlug,
    slug: row.officeSlug,
    name: row.name,
    iconKey: row.iconKey,
    description: row.description,
    activities: row.activities,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function listPublicOfficesByAreaSlug(areaSlug) {
  await assertAreaPublic(areaSlug)
  const rows = await listAreaOfficesByAreaSlug(String(areaSlug || '').trim())
  return rows.map(mapPublicSummary)
}

export async function getPublicOfficeBySlugs(areaSlug, officeSlug) {
  await assertAreaPublic(areaSlug)
  const row = await findAreaOfficeByAreaAndSlug(
    String(areaSlug || '').trim(),
    String(officeSlug || '').trim(),
  )
  if (!row) throw new AppError('Oficina no encontrada.', 404)
  return mapPublicDetail(row)
}

export async function listAdminOfficesByAreaSlug(areaSlug) {
  await assertAreaExistsForStaff(areaSlug)
  const rows = await listAreaOfficesByAreaSlug(String(areaSlug || '').trim())
  return rows.map(mapAdminRow)
}

export async function createAreaOffice(areaSlug, payload) {
  await assertAreaExistsForStaff(areaSlug)
  const area = String(areaSlug || '').trim()

  const name = cleanString(payload?.name, 200)
  if (!name) throw new AppError('El nombre de la oficina es obligatorio.', 400)

  const rawSlug = payload?.slug ? cleanOfficeSlug(payload.slug) : ''
  const baseSlug = rawSlug || cleanOfficeSlug(name) || 'oficina'
  const officeSlug = await ensureUniqueOfficeSlug(area, baseSlug)

  const iconRaw = cleanString(payload?.iconKey, 40) || 'building'
  const iconKey = ALLOWED_ICONS.has(iconRaw) ? iconRaw : 'building'

  const description = String(payload?.description || '').trim().slice(0, 20000)
  const activities = cleanActivities(payload?.activities)
  const sortN = Number(payload?.sortOrder)
  const sortOrder = Number.isFinite(sortN) ? Math.max(0, Math.min(sortN, 2 ** 31 - 1)) : 0

  const row = await createAreaOfficeRow({
    areaSlug: area,
    officeSlug,
    name,
    iconKey,
    description,
    activities,
    sortOrder,
  })
  return mapAdminRow(row)
}

export async function updateAreaOffice(areaSlug, id, payload) {
  await assertAreaExistsForStaff(areaSlug)
  const area = String(areaSlug || '').trim()
  const existing = await findAreaOfficeByAreaSlugAndId(area, Number(id))
  if (!existing) throw new AppError('Oficina no encontrada.', 404)

  const data = {}

  if (payload?.name !== undefined) {
    const name = cleanString(payload.name, 200)
    if (!name) throw new AppError('El nombre no puede estar vacío.', 400)
    data.name = name
  }

  if (payload?.slug !== undefined) {
    const raw = cleanOfficeSlug(payload.slug)
    if (!raw) throw new AppError('El slug de la oficina no puede estar vacío.', 400)
    if (RESERVED_OFFICE_SLUGS.has(raw)) throw new AppError('Ese slug está reservado.', 400)
    const unique = await ensureUniqueOfficeSlug(area, raw, existing.id)
    data.officeSlug = unique
  }

  if (payload?.iconKey !== undefined) {
    const iconRaw = cleanString(payload.iconKey, 40) || 'building'
    data.iconKey = ALLOWED_ICONS.has(iconRaw) ? iconRaw : 'building'
  }

  if (payload?.description !== undefined) {
    data.description = String(payload.description || '').trim().slice(0, 20000)
  }

  if (payload?.activities !== undefined) {
    data.activities = cleanActivities(payload.activities)
  }

  if (payload?.sortOrder !== undefined) {
    const sortN = Number(payload.sortOrder)
    if (!Number.isFinite(sortN)) throw new AppError('Orden inválido.', 400)
    data.sortOrder = Math.max(0, Math.min(sortN, 2 ** 31 - 1))
  }

  const row = await updateAreaOfficeRow(existing.id, data)
  return mapAdminRow(row)
}

export async function removeAreaOffice(areaSlug, id) {
  await assertAreaExistsForStaff(areaSlug)
  const area = String(areaSlug || '').trim()
  const existing = await findAreaOfficeByAreaSlugAndId(area, Number(id))
  if (!existing) throw new AppError('Oficina no encontrada.', 404)
  const ok = await deleteAreaOfficeRow(existing.id)
  if (!ok) throw new AppError('Oficina no encontrada.', 404)
}
