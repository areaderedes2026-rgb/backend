import {
  findAllNews,
  findNewsByIdOrSlug,
  findNewsById,
  createNews,
  updateNews,
  deleteNews,
  slugExists,
  findGalleryUrlsByNewsId,
  deleteGalleryByNewsId,
  insertGalleryImages,
  ensureNewsStats,
  recordNewsView,
  recordNewsShare,
  getNewsStatsOverview,
} from '../models/news.model.js'
import {
  findCategoryById,
  findCategoryBySlug,
} from '../models/category.model.js'
import { mapNewsRow } from '../utils/mapNews.js'
import { slugify } from '../utils/slugify.js'
import { AppError } from '../utils/AppError.js'
import {
  deleteManagedFileByUrl,
  deleteManagedFilesByUrls,
} from '../utils/fileStorage.js'

const MAX_GALLERY = 20

async function resolveCategoryIdOrDefault(payload) {
  if (payload.categoryId != null && payload.categoryId !== '') {
    const id = Number(payload.categoryId)
    if (!Number.isFinite(id) || id < 1) {
      throw new AppError('Categoría inválida.', 400)
    }
    const cat = await findCategoryById(id)
    if (!cat) throw new AppError('La categoría no existe.', 400)
    return id
  }
  const def = await findCategoryBySlug('general')
  return def ? def.id : null
}

function normalizeGalleryUrls(input) {
  if (!Array.isArray(input)) return []
  const seen = new Set()
  const out = []
  for (const u of input) {
    if (typeof u !== 'string' || !u.trim()) continue
    const t = u.trim()
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
    if (out.length >= MAX_GALLERY) break
  }
  return out
}

export async function getAllNewsMapped() {
  const rows = await findAllNews()
  return rows.map((row) => mapNewsRow(row, []))
}

export async function getOneNews(idOrSlug) {
  const row = await findNewsByIdOrSlug(idOrSlug)
  if (!row) return null
  const gallery = await findGalleryUrlsByNewsId(row.id)
  return mapNewsRow(row, gallery)
}

async function ensureUniqueSlug(base, excludeId = null) {
  let slug = base
  let n = 0
  while (await slugExists(slug, excludeId)) {
    n += 1
    slug = `${base}-${n}`
  }
  return slug
}

export async function createNewsRecord(payload, createdBy) {
  const title = String(payload.title || '').trim()
  if (!title) throw new AppError('El título es obligatorio.', 400)

  const rawSlug = payload.slug ? String(payload.slug).trim() : slugify(title)
  const slug = await ensureUniqueSlug(rawSlug || slugify(title))

  const summary = String(payload.summary ?? '').trim()
  const body = String(payload.body ?? '').trim()
  if (!summary || !body) {
    throw new AppError('Resumen y cuerpo son obligatorios.', 400)
  }

  const publishedAt = payload.publishedAt
    ? new Date(payload.publishedAt)
    : new Date()
  if (Number.isNaN(publishedAt.getTime())) {
    throw new AppError('Fecha de publicación inválida.', 400)
  }

  const categoryId = await resolveCategoryIdOrDefault(payload)

  const row = await createNews({
    slug,
    title,
    summary,
    body,
    publishedAt,
    categoryId,
    imageUrl: payload.imageUrl ?? null,
    createdBy,
  })

  const gallery = normalizeGalleryUrls(payload.galleryUrls)
  if (gallery.length) {
    await insertGalleryImages(row.id, gallery)
  }
  await ensureNewsStats(row.id)

  const galleryRows = await findGalleryUrlsByNewsId(row.id)
  return mapNewsRow(row, galleryRows)
}

export async function updateNewsRecord(id, payload, updatedBy) {
  const existing = await findNewsById(Number(id))
  if (!existing) return null

  const data = {}
  if (payload.title !== undefined) data.title = String(payload.title).trim()
  if (payload.summary !== undefined) data.summary = String(payload.summary)
  if (payload.body !== undefined) data.body = String(payload.body)
  if (payload.categoryId !== undefined) {
    data.categoryId = await resolveCategoryIdOrDefault(payload)
  }
  if (payload.imageUrl !== undefined) {
    const nextCover = payload.imageUrl
    const prevCover = existing.image_url
    if (prevCover && prevCover !== nextCover) {
      await deleteManagedFileByUrl(prevCover)
    }
    data.imageUrl = nextCover
  }
  if (payload.publishedAt !== undefined) {
    const d = new Date(payload.publishedAt)
    if (Number.isNaN(d.getTime())) {
      throw new AppError('Fecha de publicación inválida.', 400)
    }
    data.publishedAt = d
  }
  if (payload.slug !== undefined) {
    const s = String(payload.slug).trim()
    if (s && (await slugExists(s, Number(id)))) {
      throw new AppError('Ya existe otra noticia con ese slug.', 409)
    }
    data.slug = s || existing.slug
  }

  const row = await updateNews(Number(id), data, updatedBy ?? null)

  if (payload.galleryUrls !== undefined) {
    const prev = await findGalleryUrlsByNewsId(Number(id))
    const next = normalizeGalleryUrls(payload.galleryUrls)
    const removed = prev.filter((u) => !next.includes(u))
    await deleteManagedFilesByUrls(removed)
    await deleteGalleryByNewsId(Number(id))
    await insertGalleryImages(Number(id), next)
  }

  const galleryRows = await findGalleryUrlsByNewsId(Number(id))
  return mapNewsRow(row, galleryRows)
}

export async function recordNewsInteraction(idOrSlug, type, channel = null) {
  const row = await findNewsByIdOrSlug(idOrSlug)
  if (!row) return null
  if (type === 'view') {
    await recordNewsView(row.id)
  } else if (type === 'share' && channel) {
    await recordNewsShare(row.id, channel)
  }
  const gallery = await findGalleryUrlsByNewsId(row.id)
  const fresh = await findNewsById(row.id)
  return mapNewsRow(fresh, gallery)
}

export async function getNewsStatsDashboard() {
  return getNewsStatsOverview()
}

/**
 * Elimina la noticia en BD (CASCADE sobre `news_images`) y luego intenta
 * borrar en Cloudinary las URLs gestionadas. Si falla el borrado remoto,
 * la noticia ya no existe en BD; se registra el error para diagnóstico.
 */
export async function removeNews(id) {
  const nid = Number(id)
  const row = await findNewsById(nid)
  if (!row) return false

  const gallery = await findGalleryUrlsByNewsId(nid)
  const urls = new Set()
  if (row.image_url) urls.add(row.image_url)
  for (const u of gallery) {
    if (u) urls.add(u)
  }

  const ok = await deleteNews(nid)
  if (!ok) return false

  for (const url of urls) {
    try {
      await deleteManagedFileByUrl(url)
    } catch (err) {
      console.error('[news] No se pudo borrar asset en storage:', url, err)
    }
  }
  return true
}
