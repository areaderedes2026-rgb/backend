import {
  listCategories,
  findCategoryById,
  findCategoryBySlug,
  findCategoryByName,
  createCategoryRow,
  updateCategoryRow,
  deleteCategoryRow,
  countNewsByCategoryId,
} from '../models/category.model.js'
import { mapCategoryRow } from '../utils/mapCategory.js'
import { slugify } from '../utils/slugify.js'
import { AppError } from '../utils/AppError.js'

async function ensureUniqueCategorySlug(base, excludeId = null) {
  let slug = base || 'categoria'
  let n = 0
  while (true) {
    const existing = await findCategoryBySlug(slug)
    if (!existing || (excludeId != null && Number(existing.id) === Number(excludeId))) {
      return slug
    }
    n += 1
    slug = `${base}-${n}`
  }
}

export async function getCategoriesList() {
  const rows = await listCategories()
  return rows.map(mapCategoryRow)
}

export async function getCategoryById(id) {
  const row = await findCategoryById(Number(id))
  if (!row) throw new AppError('Categoría no encontrada.', 404)
  return mapCategoryRow(row)
}

export async function createCategoryRecord(payload) {
  const name = String(payload.name || '').trim()
  if (!name) throw new AppError('El nombre es obligatorio.', 400)
  if (name.length > 120) throw new AppError('El nombre es demasiado largo.', 400)

  const other = await findCategoryByName(name)
  if (other) throw new AppError('Ya existe una categoría con ese nombre.', 409)

  const rawSlug = payload.slug ? String(payload.slug).trim() : slugify(name)
  const slug = await ensureUniqueCategorySlug(rawSlug || slugify(name))

  const sortOrder =
    payload.sortOrder != null ? Number(payload.sortOrder) : undefined
  let order = 0
  if (Number.isFinite(sortOrder)) {
    order = Math.max(0, sortOrder)
  } else {
    const rows = await listCategories()
    const max = rows.reduce((m, r) => Math.max(m, Number(r.sort_order) || 0), 0)
    order = max + 10
  }

  const row = await createCategoryRow({
    name,
    slug,
    sortOrder: order,
  })
  return mapCategoryRow(row)
}

export async function updateCategoryRecord(id, payload) {
  const existing = await findCategoryById(Number(id))
  if (!existing) throw new AppError('Categoría no encontrada.', 404)

  const data = {}
  if (payload.name !== undefined) {
    const name = String(payload.name).trim()
    if (!name) throw new AppError('El nombre no puede quedar vacío.', 400)
    const other = await findCategoryByName(name)
    if (other && other.id !== existing.id) {
      throw new AppError('Ya existe una categoría con ese nombre.', 409)
    }
    data.name = name
  }
  if (payload.slug !== undefined) {
    const s = String(payload.slug).trim()
    data.slug = s ? await ensureUniqueCategorySlug(slugify(s), existing.id) : existing.slug
  }
  if (payload.sortOrder !== undefined) {
    const n = Number(payload.sortOrder)
    if (Number.isFinite(n)) data.sortOrder = Math.max(0, n)
  }

  const row = await updateCategoryRow(Number(id), data)
  return mapCategoryRow(row)
}

export async function removeCategory(id) {
  const count = await countNewsByCategoryId(Number(id))
  if (count > 0) {
    throw new AppError(
      'No se puede eliminar: hay noticias asociadas a esta categoría.',
      409,
    )
  }
  const ok = await deleteCategoryRow(Number(id))
  if (!ok) throw new AppError('Categoría no encontrada.', 404)
}
