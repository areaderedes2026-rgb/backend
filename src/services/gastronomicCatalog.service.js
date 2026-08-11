import {
  getGastronomicCatalogContentRow,
  upsertGastronomicCatalogContentRow,
} from '../models/gastronomicCatalog.model.js'
import { assertOptimisticLock } from '../utils/concurrency.js'
import { sanitizePageHeroCoverPayload } from '../utils/pageHeroCover.js'

const VENUE_DESCRIPTION_MAX = 2500

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
  if (
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('/') ||
    v.startsWith('#')
  ) {
    return v
  }
  return ''
}

function cleanPhone(value) {
  return cleanString(value, 40)
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
    return ['Todos', 'Bares', 'Cafeterías', 'Restaurantes', 'Otros']
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

function sanitizeVenue(item, categorySet) {
  const id = cleanString(item?.id, 90) || `local-${Math.random().toString(36).slice(2, 9)}`
  let category = cleanString(item?.category, 100)
  if (category && category !== 'Todos' && !categorySet.has(category)) {
    const first = [...categorySet].find((c) => c !== 'Todos')
    category = first || 'Otros'
  }
  if (!category || category === 'Todos') {
    const first = [...categorySet].find((c) => c !== 'Todos')
    category = first || 'Otros'
  }
  const name = cleanString(item?.name, 180)
  const location = cleanString(item?.location, 320)
  const phone = cleanPhone(item?.phone)
  const description = cleanMultiline(item?.description, VENUE_DESCRIPTION_MAX)
  const imageUrl = cleanUrl(item?.imageUrl, 2048)
  const hours = cleanString(item?.hours, 180)
  const mapsUrl = cleanUrl(item?.mapsUrl, 2048)
  const instagram = cleanString(item?.instagram, 180)
  const whatsapp = cleanString(item?.whatsapp, 40)
  const isActive = item?.isActive !== false
  const sortOrder = Number.isFinite(Number(item?.sortOrder))
    ? Math.max(0, Math.round(Number(item.sortOrder)))
    : 0
  if (!name && !description) return null
  return {
    id,
    category,
    name,
    location,
    phone,
    description,
    imageUrl,
    hours,
    mapsUrl,
    instagram,
    whatsapp,
    isActive,
    sortOrder,
  }
}

function sanitizeVenues(input, categories) {
  const categorySet = new Set(categories)
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const item of raw.slice(0, 80)) {
    const venue = sanitizeVenue(item, categorySet)
    if (venue) out.push(venue)
  }
  return out.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return String(a.name).localeCompare(String(b.name), 'es')
  })
}

function sanitizePayload(payload, { current } = {}) {
  const categories = sanitizeCategories(payload?.categories)
  const heroCover = sanitizePageHeroCoverPayload(
    {
      heroImageUrl: payload?.heroImageUrl,
      overlayOpacity: payload?.overlayOpacity,
      heroBadge: payload?.heroEyebrow,
      heroTitle: payload?.heroTitle,
      heroSubtitle: payload?.heroSubtitle,
      heroSearchPlaceholder: payload?.heroSearchPlaceholder,
      showHeroBadge: payload?.showHeroBadge,
      showHeroTitle: payload?.showHeroTitle,
      showHeroSubtitle: payload?.showHeroSubtitle,
      showSearch: payload?.showSearch,
      showPrimaryButton: payload?.showPrimaryButton,
      primaryLabel: payload?.heroPrimaryLabel,
      primaryHref: payload?.heroPrimaryHref,
      showSecondaryButton: payload?.showSecondaryButton,
      secondaryLabel: payload?.heroSecondaryLabel,
      secondaryHref: payload?.heroSecondaryHref,
    },
    {
      current: current
        ? {
            overlayOpacity: current.overlayOpacity,
            showHeroBadge: current.showHeroBadge,
            showHeroTitle: current.showHeroTitle,
            showHeroSubtitle: current.showHeroSubtitle,
            showSearch: current.showSearch,
            showPrimaryButton: current.showPrimaryButton,
            showSecondaryButton: current.showSecondaryButton,
          }
        : undefined,
    },
  )
  return {
    heroEyebrow: heroCover.heroBadge,
    heroTitle: heroCover.heroTitle,
    heroSubtitle: heroCover.heroSubtitle,
    heroImageUrl: heroCover.heroImageUrl,
    overlayOpacity: heroCover.overlayOpacity,
    heroPrimaryLabel: heroCover.primaryLabel,
    heroPrimaryHref: heroCover.primaryHref,
    heroSecondaryLabel: heroCover.secondaryLabel,
    heroSecondaryHref: heroCover.secondaryHref,
    heroSearchPlaceholder: heroCover.heroSearchPlaceholder,
    showHeroBadge: heroCover.showHeroBadge,
    showHeroTitle: heroCover.showHeroTitle,
    showHeroSubtitle: heroCover.showHeroSubtitle,
    showSearch: heroCover.showSearch,
    showPrimaryButton: heroCover.showPrimaryButton,
    showSecondaryButton: heroCover.showSecondaryButton,
    introTitle: cleanString(payload?.introTitle, 220),
    introParagraphs: sanitizeParagraphs(payload?.introParagraphs),
    highlights: sanitizeHighlights(payload?.highlights),
    categories,
    venues: sanitizeVenues(payload?.venues, categories),
    ctaTitle: cleanString(payload?.ctaTitle, 240),
    ctaBody: cleanMultiline(payload?.ctaBody, 2500),
  }
}

export async function getGastronomicCatalogContent() {
  return getGastronomicCatalogContentRow()
}

export async function saveGastronomicCatalogContent(payload) {
  const current = await getGastronomicCatalogContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'contenido del catálogo gastronómico',
    Boolean(payload?.forceOverwrite),
  )
  const data = sanitizePayload(payload, { current })
  return upsertGastronomicCatalogContentRow(data)
}
