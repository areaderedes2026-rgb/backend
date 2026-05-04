import {
  getOfertaAcademicaContentRow,
  upsertOfertaAcademicaContentRow,
} from '../models/ofertaAcademica.model.js'

function cleanString(value, maxLen = 0) {
  const v = String(value || '').trim()
  if (!maxLen) return v
  return v.slice(0, maxLen)
}

function cleanMultiline(value, maxLen = 0) {
  const v = String(value || '').replace(/\r\n/g, '\n').trim()
  if (!maxLen) return v
  return v.slice(0, maxLen)
}

function cleanUrl(value, maxLen = 2048) {
  const v = cleanString(value, maxLen)
  if (!v) return ''
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  return ''
}

function sanitizeCategories(input) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const c of raw.slice(0, 16)) {
    const s = cleanString(c, 80)
    if (s) out.push(s)
  }
  const noDup = [...new Set(out)]
  if (!noDup.length || noDup[0] !== 'Todos') {
    return ['Todos', ...noDup.filter((x) => x !== 'Todos')]
  }
  const rest = noDup.slice(1).filter(Boolean)
  if (!rest.length) {
    return ['Todos', 'Cursos y talleres']
  }
  return noDup
}

function sanitizeParagraphs(input) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const p of raw.slice(0, 12)) {
    const s = cleanMultiline(p, 2000)
    if (s) out.push(s)
  }
  return out
}

function sanitizeHighlights(input) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const h of raw.slice(0, 6)) {
    const label = cleanString(h?.label, 100)
    const value = cleanString(h?.value, 120)
    if (!label && !value) continue
    out.push({ label, value })
  }
  return out
}

function sanitizeLink(link) {
  if (!link || typeof link !== 'object') return null
  const label = cleanString(link.label, 120)
  const href = cleanUrl(link.href, 2048)
  if (!href) return null
  return { label: label || 'Más información', href }
}

function sanitizeOffer(item, categorySet) {
  const id = cleanString(item?.id, 90) || `oferta-${Math.random().toString(36).slice(2, 9)}`
  let category = cleanString(item?.category, 100)
  if (category && category !== 'Todos' && !categorySet.has(category)) {
    const first = [...categorySet].find((c) => c !== 'Todos')
    category = first || 'Cursos y talleres'
  }
  if (!category || category === 'Todos') {
    const first = [...categorySet].find((c) => c !== 'Todos')
    category = first || 'Cursos y talleres'
  }
  const title = cleanString(item?.title, 240)
  const provider = cleanString(item?.provider, 200)
  const modality = cleanString(item?.modality, 120)
  const duration = cleanString(item?.duration, 160)
  const location = cleanString(item?.location, 320)
  const summary = cleanString(item?.summary, 600)
  const details = (Array.isArray(item?.details) ? item.details : [])
    .slice(0, 14)
    .map((d) => cleanMultiline(d, 1600))
    .filter(Boolean)
  const requirements = (Array.isArray(item?.requirements) ? item.requirements : [])
    .slice(0, 18)
    .map((r) => cleanString(r, 320))
    .filter(Boolean)
  const inscription = cleanMultiline(item?.inscription, 1400)
  const tags = (Array.isArray(item?.tags) ? item.tags : [])
    .slice(0, 10)
    .map((t) => cleanString(t, 64))
    .filter(Boolean)
  const link = sanitizeLink(item?.link)
  if (!title && !summary) return null
  return {
    id,
    category,
    title,
    provider,
    modality,
    duration,
    location,
    summary,
    details,
    requirements,
    inscription,
    tags,
    link,
  }
}

function sanitizeOffers(input, categories) {
  const categorySet = new Set(categories)
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const item of raw.slice(0, 40)) {
    const o = sanitizeOffer(item, categorySet)
    if (o) out.push(o)
  }
  return out
}

function sanitizePayload(payload) {
  const categories = sanitizeCategories(payload?.categories)
  const categorySet = new Set(categories)
  return {
    heroEyebrow: cleanString(payload?.heroEyebrow, 180),
    heroTitle: cleanString(payload?.heroTitle, 220),
    heroSubtitle: cleanMultiline(payload?.heroSubtitle, 2500),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    introTitle: cleanString(payload?.introTitle, 220),
    introParagraphs: sanitizeParagraphs(payload?.introParagraphs),
    highlights: sanitizeHighlights(payload?.highlights),
    categories,
    offers: sanitizeOffers(payload?.offers, categories),
    ctaTitle: cleanString(payload?.ctaTitle, 240),
    ctaBody: cleanMultiline(payload?.ctaBody, 2500),
  }
}

export async function getOfertaAcademicaContent() {
  return getOfertaAcademicaContentRow()
}

export async function saveOfertaAcademicaContent(payload) {
  const data = sanitizePayload(payload)
  return upsertOfertaAcademicaContentRow(data)
}
