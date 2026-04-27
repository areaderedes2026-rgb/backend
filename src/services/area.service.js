import {
  listAreas,
  findAreaBySlug,
  findAreaById,
  findAreaByTitle,
  createAreaRow,
  updateAreaRow,
  deleteAreaRow,
} from '../models/area.model.js'
import { deleteAreaProfileBySlug } from '../models/areaProfile.model.js'
import { slugify } from '../utils/slugify.js'
import { AppError } from '../utils/AppError.js'

function mapAreaRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImage: row.cover_image_url || '',
    sortOrder: Number(row.sort_order) || 0,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function ensureUniqueAreaSlug(base, excludeId = null) {
  let slug = base || 'area'
  let n = 0
  while (true) {
    const existing = await findAreaBySlug(slug, { includeInactive: true })
    if (!existing || (excludeId != null && Number(existing.id) === Number(excludeId))) {
      return slug
    }
    n += 1
    slug = `${base}-${n}`
  }
}

function sanitizeUrl(value) {
  const v = String(value || '').trim()
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v.slice(0, 2048)
  throw new AppError('La URL de portada debe iniciar con http:// o https://', 400)
}

export async function getPublicAreasList() {
  const rows = await listAreas()
  return rows.map(mapAreaRow)
}

export async function getAreaPublicBySlug(slug) {
  const row = await findAreaBySlug(String(slug || '').trim(), { includeInactive: false })
  if (!row) throw new AppError('Área no encontrada.', 404)
  return mapAreaRow(row)
}

export async function getAreasAdminList() {
  const rows = await listAreas({ includeInactive: true })
  return rows.map(mapAreaRow)
}

export async function createAreaRecord(payload) {
  const title = String(payload?.title || '').trim()
  const description = String(payload?.description || '').trim()
  if (!title) throw new AppError('El título del área es obligatorio.', 400)
  if (!description) throw new AppError('La descripción del área es obligatoria.', 400)
  if (title.length > 160) throw new AppError('El título es demasiado largo.', 400)

  const titleInUse = await findAreaByTitle(title)
  if (titleInUse) throw new AppError('Ya existe un área con ese título.', 409)

  const rawSlug = payload?.slug ? String(payload.slug).trim() : slugify(title)
  const slug = await ensureUniqueAreaSlug(slugify(rawSlug || title))
  const coverImageUrl = sanitizeUrl(payload?.coverImage)
  const sortOrderNum = Number(payload?.sortOrder)
  const sortOrder = Number.isFinite(sortOrderNum) ? Math.max(0, sortOrderNum) : 0

  const row = await createAreaRow({
    slug,
    title,
    description,
    coverImageUrl,
    sortOrder,
    isActive: true,
  })
  return mapAreaRow(row)
}

export async function updateAreaRecord(id, payload) {
  const existing = await findAreaById(Number(id))
  if (!existing) throw new AppError('Área no encontrada.', 404)

  const data = {}

  if (payload?.title !== undefined) {
    const title = String(payload.title || '').trim()
    if (!title) throw new AppError('El título no puede estar vacío.', 400)
    if (title.length > 160) throw new AppError('El título es demasiado largo.', 400)
    const titleInUse = await findAreaByTitle(title)
    if (titleInUse && Number(titleInUse.id) !== Number(existing.id)) {
      throw new AppError('Ya existe un área con ese título.', 409)
    }
    data.title = title
  }

  if (payload?.description !== undefined) {
    const description = String(payload.description || '').trim()
    if (!description) throw new AppError('La descripción no puede estar vacía.', 400)
    data.description = description
  }

  if (payload?.slug !== undefined) {
    const raw = String(payload.slug || '').trim()
    if (!raw) throw new AppError('El slug no puede estar vacío.', 400)
    data.slug = await ensureUniqueAreaSlug(slugify(raw), existing.id)
  }

  if (payload?.coverImage !== undefined) {
    data.coverImageUrl = sanitizeUrl(payload.coverImage)
  }

  if (payload?.sortOrder !== undefined) {
    const n = Number(payload.sortOrder)
    if (!Number.isFinite(n)) throw new AppError('Orden inválido.', 400)
    data.sortOrder = Math.max(0, n)
  }

  if (payload?.isActive !== undefined) {
    data.isActive = Boolean(payload.isActive)
  }

  const row = await updateAreaRow(Number(id), data)
  return mapAreaRow(row)
}

export async function removeAreaRecord(id) {
  const existing = await findAreaById(Number(id))
  if (!existing) throw new AppError('Área no encontrada.', 404)
  await deleteAreaProfileBySlug(existing.slug)
  const ok = await deleteAreaRow(Number(id))
  if (!ok) throw new AppError('Área no encontrada.', 404)
}
