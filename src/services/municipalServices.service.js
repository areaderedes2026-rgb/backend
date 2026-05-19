import {
  createMunicipalServiceRow,
  deleteMunicipalServiceRow,
  findMunicipalServiceById,
  findMunicipalServiceBySlugAny,
  listMunicipalServices,
  updateMunicipalServiceRow,
} from '../models/municipalService.model.js'
import {
  getServicesPageContentRow,
  upsertServicesPageContentRow,
} from '../models/servicesPageContent.model.js'
import { AppError } from '../utils/AppError.js'
import { assertOptimisticLock } from '../utils/concurrency.js'

function cleanString(value, maxLen = 0) {
  const out = String(value ?? '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanMultiline(value, maxLen = 0) {
  const out = String(value ?? '').replace(/\r\n/g, '\n')
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanUrl(value, maxLen = 2048) {
  const out = cleanString(value, maxLen)
  if (!out) return ''
  if (
    out.startsWith('http://') ||
    out.startsWith('https://') ||
    out.startsWith('/') ||
    out.startsWith('#')
  ) {
    return out
  }
  return ''
}

function cleanList(list, mapper, maxItems = 50) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const item of list.slice(0, maxItems)) {
    const mapped = mapper(item)
    if (mapped) out.push(mapped)
  }
  return out
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

async function ensureUniqueSlug(baseSlug, currentId = 0) {
  const root = slugify(baseSlug) || `tramite-${Date.now().toString(36)}`
  let candidate = root
  let i = 2
  while (true) {
    const existing = await findMunicipalServiceBySlugAny(candidate)
    if (!existing || existing.id === currentId) return candidate
    candidate = `${root}-${i}`
    i += 1
  }
}

function sanitizeContentPayload(payload) {
  return {
    heroEyebrow: cleanString(payload?.heroEyebrow, 120),
    heroTitle: cleanString(payload?.heroTitle, 180),
    heroSubtitle: cleanMultiline(payload?.heroSubtitle, 2500),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    heroPrimaryLabel: cleanString(payload?.heroPrimaryLabel, 80),
    heroPrimaryHref: cleanUrl(payload?.heroPrimaryHref, 2048) || '#tramites-disponibles',
    heroSecondaryLabel: cleanString(payload?.heroSecondaryLabel, 80),
    heroSecondaryHref: cleanUrl(payload?.heroSecondaryHref, 2048) || '/atencion-ciudadano',
    steps: cleanList(
      payload?.steps,
      (item) => {
        const text = cleanString(item, 400)
        return text || null
      },
      12,
    ),
    scheduleLines: cleanList(
      payload?.scheduleLines,
      (item) => {
        const text = cleanString(item, 260)
        return text || null
      },
      8,
    ),
    categories: cleanList(
      payload?.categories,
      (item) => {
        const text = cleanString(item, 80)
        return text || null
      },
      24,
    ),
    proceduresEyebrow: cleanString(payload?.proceduresEyebrow, 120),
    proceduresTitle: cleanString(payload?.proceduresTitle, 180),
    faq: cleanList(
      payload?.faq,
      (item) => {
        const q = cleanString(item?.q, 400)
        const a = cleanMultiline(item?.a, 2000)
        if (!q && !a) return null
        return {
          id: cleanString(item?.id, 60) || `faq-${Math.random().toString(36).slice(2, 9)}`,
          q,
          a,
        }
      },
      24,
    ),
    finalCtaTitle: cleanString(payload?.finalCtaTitle, 180),
    finalCtaText: cleanMultiline(payload?.finalCtaText, 2000),
    finalPrimaryLabel: cleanString(payload?.finalPrimaryLabel, 80),
    finalPrimaryHref: cleanUrl(payload?.finalPrimaryHref, 2048) || '/atencion-ciudadano',
    finalSecondaryLabel: cleanString(payload?.finalSecondaryLabel, 80),
    finalSecondaryHref: cleanUrl(payload?.finalSecondaryHref, 2048) || '/news',
  }
}

function sanitizeServicePayload(payload, { forUpdate = false } = {}) {
  const title = cleanString(payload?.title, 180)
  const summary = cleanMultiline(payload?.summary, 4000)
  if (!forUpdate && !title) throw new AppError('El título del trámite es obligatorio.', 400)
  if (!forUpdate && !summary) throw new AppError('La descripción del trámite es obligatoria.', 400)
  return {
    title,
    slug: cleanString(payload?.slug, 90),
    category: cleanString(payload?.category, 80),
    mode: cleanString(payload?.mode, 140),
    eta: cleanString(payload?.eta, 120),
    summary,
    docs: cleanList(
      payload?.docs,
      (item) => {
        const text = cleanString(item, 200)
        return text || null
      },
      20,
    ),
    linkHref: cleanUrl(payload?.linkHref, 2048) || '/atencion-ciudadano',
    sortOrder: Number.isFinite(Number(payload?.sortOrder))
      ? Math.max(Number(payload.sortOrder), 0)
      : 0,
    isActive: payload?.isActive !== false,
  }
}

export async function getServicesPageContentPublic() {
  const row = await getServicesPageContentRow()
  return row || sanitizeContentPayload({})
}

export async function saveServicesPageContent(body) {
  const current = await getServicesPageContentRow()
  assertOptimisticLock(body?.expectedUpdatedAt, current?.updatedAt, 'contenido de servicios')
  const payload = sanitizeContentPayload(body)
  return upsertServicesPageContentRow(payload)
}

export async function getMunicipalServicesPublic() {
  return listMunicipalServices({ onlyActive: true })
}

export async function getMunicipalServicesAdmin() {
  return listMunicipalServices({ onlyActive: false })
}

export async function createMunicipalService(body) {
  const data = sanitizeServicePayload(body)
  const slug = await ensureUniqueSlug(data.slug || data.title)
  return createMunicipalServiceRow({ ...data, slug })
}

export async function editMunicipalService(id, body) {
  const existing = await findMunicipalServiceById(id)
  if (!existing) throw new AppError('Trámite no encontrado.', 404)
  const data = sanitizeServicePayload(body, { forUpdate: true })
  const slug = await ensureUniqueSlug(data.slug || data.title || existing.slug, existing.id)
  return updateMunicipalServiceRow(id, {
    ...data,
    title: data.title || existing.title,
    summary: data.summary || existing.summary,
    slug,
  })
}

export async function removeMunicipalService(id) {
  const existing = await findMunicipalServiceById(id)
  if (!existing) throw new AppError('Trámite no encontrado.', 404)
  const ok = await deleteMunicipalServiceRow(id)
  if (!ok) throw new AppError('No se pudo eliminar el trámite.', 500)
}
