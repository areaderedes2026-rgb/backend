import {
  createTourismPlaceRow,
  deleteTourismPlaceRow,
  findTourismPlaceById,
  findTourismPlaceByName,
  findTourismPlaceBySlug,
  findTourismPlaceBySlugAny,
  listTourismPlaces,
  updateTourismPlaceRow,
} from '../models/tourismPlace.model.js'
import { AppError } from '../utils/AppError.js'

function cleanString(value, maxLen = 0) {
  const out = String(value || '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanMultiline(value, maxLen = 0) {
  const out = String(value || '').replace(/\r\n/g, '\n')
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanUrl(value, maxLen = 2048) {
  const out = cleanString(value, maxLen)
  if (!out) return ''
  if (out.startsWith('http://') || out.startsWith('https://')) return out
  return ''
}

function slugify(value) {
  return cleanString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function cleanList(list, mapper, maxItems = 40) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const item of list.slice(0, maxItems)) {
    const mapped = mapper(item)
    if (mapped) out.push(mapped)
  }
  return out
}

async function ensureUniqueSlug(baseSlug, currentId = 0) {
  const root = slugify(baseSlug) || `lugar-${Date.now().toString(36)}`
  let candidate = root
  let i = 2
  while (true) {
    const existing = await findTourismPlaceBySlugAny(candidate)
    if (!existing || existing.id === currentId) return candidate
    candidate = `${root}-${i}`
    i += 1
  }
}

function sanitizePayload(payload, { forUpdate = false } = {}) {
  const name = cleanString(payload?.name, 180)
  const fullDescription = cleanMultiline(payload?.fullDescription, 10000)
  if (!forUpdate && !name) throw new AppError('El nombre del lugar es obligatorio.', 400)
  if (!forUpdate && !fullDescription) {
    throw new AppError('La descripción detallada es obligatoria.', 400)
  }
  return {
    name,
    slug: cleanString(payload?.slug, 90),
    category: cleanString(payload?.category, 80),
    shortDescription: cleanMultiline(payload?.shortDescription, 1200),
    fullDescription,
    imageUrl: cleanUrl(payload?.imageUrl, 2048),
    gallery: cleanList(
      payload?.gallery,
      (item) => {
        const value = cleanUrl(item, 2048)
        return value || null
      },
      18,
    ),
    address: cleanString(payload?.address, 260),
    howToGet: cleanMultiline(payload?.howToGet, 2500),
    mapEmbedUrl: cleanUrl(payload?.mapEmbedUrl, 2048),
    mapExternalUrl: cleanUrl(payload?.mapExternalUrl, 2048),
    contactPhone: cleanString(payload?.contactPhone, 80),
    contactEmail: cleanString(payload?.contactEmail, 180),
    contactWhatsapp: cleanString(payload?.contactWhatsapp, 80),
    visitingHours: cleanString(payload?.visitingHours, 180),
    sortOrder: Number.isFinite(Number(payload?.sortOrder)) ? Math.max(Number(payload.sortOrder), 0) : 0,
    isActive: payload?.isActive !== false,
  }
}

export async function getTourismPlacesPublic() {
  return listTourismPlaces({ onlyActive: true })
}

export async function getTourismPlacePublicBySlug(slug) {
  const value = slugify(slug)
  if (!value) throw new AppError('Slug inválido.', 400)
  const place = await findTourismPlaceBySlug(value, { includeInactive: false })
  if (!place) throw new AppError('Lugar turístico no encontrado.', 404)
  return place
}

export async function getTourismPlacesAdmin() {
  return listTourismPlaces({ onlyActive: false })
}

export async function createTourismPlace(payload) {
  const data = sanitizePayload(payload)
  const sameName = await findTourismPlaceByName(data.name)
  if (sameName) throw new AppError('Ya existe un lugar turístico con ese nombre.', 409)
  const slug = await ensureUniqueSlug(data.slug || data.name)
  return createTourismPlaceRow({ ...data, slug })
}

export async function editTourismPlace(id, payload) {
  const placeId = Number(id)
  if (!Number.isInteger(placeId) || placeId <= 0) throw new AppError('ID inválido.', 400)
  const existing = await findTourismPlaceById(placeId)
  if (!existing) throw new AppError('Lugar turístico no encontrado.', 404)
  const data = sanitizePayload(payload, { forUpdate: true })
  const nextName = data.name || existing.name
  const sameName = await findTourismPlaceByName(nextName)
  if (sameName && sameName.id !== placeId) {
    throw new AppError('Ya existe un lugar turístico con ese nombre.', 409)
  }
  const nextSlug = await ensureUniqueSlug(data.slug || nextName, placeId)
  return updateTourismPlaceRow(placeId, {
    ...existing,
    ...data,
    name: nextName,
    slug: nextSlug,
  })
}

export async function removeTourismPlace(id) {
  const placeId = Number(id)
  if (!Number.isInteger(placeId) || placeId <= 0) throw new AppError('ID inválido.', 400)
  const exists = await findTourismPlaceById(placeId)
  if (!exists) throw new AppError('Lugar turístico no encontrado.', 404)
  await deleteTourismPlaceRow(placeId)
}
