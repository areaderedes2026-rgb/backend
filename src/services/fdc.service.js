import {
  createFdcStallApplicationRow,
  deleteFdcStallApplicationRow,
  findFdcStallApplicationById,
  findFdcStallDuplicateByContact,
  getFdcPageContentRow,
  listFdcStallApplications,
  updateFdcStallApplicationEmailMeta,
  updateFdcStallApplicationStatusRow,
  updateFdcWhatsappMessageRow,
  upsertFdcPageContentRow,
} from '../models/fdc.model.js'
import { AppError } from '../utils/AppError.js'
import { assertOptimisticLock } from '../utils/concurrency.js'
import {
  buildFdcStallConfirmationEmail,
  isMailConfigured,
  sendMail,
} from '../utils/mail.js'
import { sanitizePageHeroCoverPayload } from '../utils/pageHeroCover.js'

export const FDC_RUBROS = [
  'Kiosco',
  'Fonda',
  'Artesanías',
  'Drugstore',
  'Food Truck',
  'Stand Comercial',
  'Instituciones',
  'Vivero / Plantas',
  'Otro',
]

function sanitizeFormRubros(input, fallback = null) {
  const source = Array.isArray(input)
    ? input
    : Array.isArray(fallback)
      ? fallback
      : FDC_RUBROS
  const seen = new Set()
  const out = []
  for (const raw of source) {
    const label = cleanString(raw, 80)
    if (!label) continue
    if (isOtherRubroLabel(label)) continue // «Otro» se agrega siempre al final
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(label)
    if (out.length >= 39) break
  }
  out.push('Otro')
  return out
}

function isOtherRubroLabel(label) {
  return String(label || '').trim().toLowerCase() === 'otro'
}

function resolveAllowedRubros(page) {
  if (Array.isArray(page?.formRubros) && page.formRubros.length) {
    return sanitizeFormRubros(page.formRubros, FDC_RUBROS)
  }
  const fromUseful = page?.usefulInfo?.formRubros
  return sanitizeFormRubros(fromUseful, FDC_RUBROS)
}

const ALLOWED_STATUS = new Set(['sin_resolver', 'leida', 'resuelta'])

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

function cleanDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
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

function newItemId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function sanitizeSectionNav(input) {
  const raw = Array.isArray(input) ? input : []
  const out = []
  for (const item of raw.slice(0, 12)) {
    const label = cleanString(item?.label, 80)
    const href = cleanString(item?.href, 240)
    if (!label && !href) continue
    if (href.toLowerCase() === '#info-util') continue
    out.push({
      id: cleanString(item?.id, 64) || newItemId('nav'),
      label,
      href,
      icon: cleanString(item?.icon, 40) || 'link',
    })
  }
  return out
}

function sanitizeSchedule(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const daysIn = Array.isArray(src.days) ? src.days : []
  const days = []
  for (const day of daysIn.slice(0, 14)) {
    const label = cleanString(day?.label, 80)
    const itemsIn = Array.isArray(day?.items) ? day.items : []
    const items = []
    for (const it of itemsIn.slice(0, 40)) {
      const time = cleanString(it?.time, 40)
      const text = cleanString(it?.text, 400)
      if (!time && !text) continue
      items.push({
        id: cleanString(it?.id, 64) || newItemId('sch'),
        time,
        text,
      })
    }
    if (!label && items.length === 0) continue
    days.push({
      id: cleanString(day?.id, 64) || newItemId('day'),
      label: label || 'Día',
      items,
    })
  }

  const images = []
  const imagesIn = Array.isArray(src.images) ? src.images : []
  for (const img of imagesIn.slice(0, 10)) {
    const imageUrl = cleanString(img?.imageUrl, 2048)
    if (!imageUrl) continue
    images.push({
      id: cleanString(img?.id, 64) || newItemId('schimg'),
      imageUrl,
      caption: cleanString(img?.caption, 200),
    })
  }
  let featuredImageUrl = cleanString(src.featuredImageUrl, 2048)
  if (images.length === 0 && featuredImageUrl) {
    images.push({ id: newItemId('schimg'), imageUrl: featuredImageUrl, caption: '' })
  }
  if (images.length > 0) {
    featuredImageUrl = images[0].imageUrl
  }

  return {
    ...extractSectionBackground(src, fallback, 'dark'),
    title: cleanString(src.title, 180) || 'Cronograma de actividades',
    featuredImageUrl,
    images,
    ctaLabel: cleanString(src.ctaLabel, 80),
    ctaHref: cleanString(src.ctaHref, 240),
    days,
  }
}

function sanitizeSectionBackgroundStyle(rawStyle, imageUrl = '') {
  const img = cleanString(imageUrl, 2048)
  const key = cleanString(rawStyle, 16).toLowerCase()
  if (key === 'dark') return 'dark'
  if (key === 'light') return 'light'
  if (key === 'image') return img ? 'image' : 'light'
  return img ? 'image' : 'light'
}

function extractSectionBackground(src, fallback, defaultStyle = 'light') {
  const fb = fallback && typeof fallback === 'object' ? fallback : {}
  const backgroundImageUrl = cleanString(src?.backgroundImageUrl, 2048)
  const overlayRaw = Number(src?.overlayOpacity)
  const overlayFallback = Number(fb.overlayOpacity)
  const overlayOpacity = Number.isFinite(overlayRaw)
    ? Math.min(90, Math.max(0, Math.round(overlayRaw)))
    : Number.isFinite(overlayFallback)
      ? Math.min(90, Math.max(0, Math.round(overlayFallback)))
      : 55
  const styleSource =
    src?.backgroundStyle != null && String(src.backgroundStyle).trim() !== ''
      ? src.backgroundStyle
      : fb.backgroundStyle ?? defaultStyle
  return {
    backgroundStyle: sanitizeSectionBackgroundStyle(styleSource, backgroundImageUrl),
    backgroundImageUrl,
    overlayOpacity,
  }
}

function sanitizeArtists(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const itemsIn = Array.isArray(src.items) ? src.items : Array.isArray(input) ? input : []
  const items = []
  for (const it of itemsIn.slice(0, 40)) {
    const name = cleanString(it?.name, 160)
    if (!name) continue
    items.push({
      id: cleanString(it?.id, 64) || newItemId('art'),
      name,
      photoUrl: cleanString(it?.photoUrl, 2048),
      dateTag: cleanString(it?.dateTag, 40),
      sortOrder: Number.isFinite(Number(it?.sortOrder)) ? Number(it.sortOrder) : items.length,
    })
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder)

  const postersIn = Array.isArray(src.dayPosters) ? src.dayPosters : []
  const dayPosters = []
  for (const it of postersIn.slice(0, 4)) {
    const imageUrl = cleanString(it?.imageUrl, 2048)
    if (!imageUrl) continue
    dayPosters.push({
      id: cleanString(it?.id, 64) || newItemId('dp'),
      label: cleanString(it?.label, 80),
      imageUrl,
      sortOrder: Number.isFinite(Number(it?.sortOrder)) ? Number(it.sortOrder) : dayPosters.length,
    })
  }
  dayPosters.sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    ...extractSectionBackground(src, fallback, 'light'),
    title: cleanString(src.title, 180) || 'Cartelera artística',
    ctaLabel: cleanString(src.ctaLabel, 80),
    ctaHref: cleanString(src.ctaHref, 240),
    dayPosters,
    items,
  }
}

function sanitizeTickets(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const bulletsIn = Array.isArray(src.bullets) ? src.bullets : []
  const bullets = []
  for (const b of bulletsIn.slice(0, 10)) {
    const s = cleanString(b, 200)
    if (s) bullets.push(s)
  }
  const imageUrl = cleanString(src.imageUrl, 2048)
  const bg = extractSectionBackground(
    { ...src, backgroundImageUrl: src.backgroundImageUrl || imageUrl },
    fallback,
    'light',
  )
  return {
    title: cleanString(src.title, 180) || 'Entradas online',
    body: cleanMultiline(src.body, 1200),
    bullets,
    ctaLabel: cleanString(src.ctaLabel, 80) || 'Comprar entradas',
    ctaUrl: cleanString(src.ctaUrl, 2048),
    backgroundStyle: sanitizeSectionBackgroundStyle(
      src.backgroundStyle ?? fallback?.backgroundStyle,
      imageUrl,
    ),
    imageUrl,
    overlayOpacity: bg.overlayOpacity,
  }
}

function sanitizeNews(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const itemsIn = Array.isArray(src.items) ? src.items : Array.isArray(input) ? input : []
  const items = []
  for (const it of itemsIn.slice(0, 24)) {
    const title = cleanString(it?.title, 220)
    if (!title) continue
    items.push({
      id: cleanString(it?.id, 64) || newItemId('news'),
      title,
      date: cleanString(it?.date, 40),
      imageUrl: cleanString(it?.imageUrl, 2048),
      link: cleanString(it?.link, 2048),
      excerpt: cleanString(it?.excerpt, 400),
    })
  }
  return {
    ...extractSectionBackground(src, fallback, 'light'),
    title: cleanString(src.title, 180) || 'Noticias del festival',
    ctaLabel: cleanString(src.ctaLabel, 80),
    ctaHref: cleanString(src.ctaHref, 240),
    items,
  }
}

function sanitizeGallery(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const itemsIn = Array.isArray(src.items) ? src.items : Array.isArray(input) ? input : []
  const items = []
  for (const it of itemsIn.slice(0, 30)) {
    if (typeof it === 'string') {
      const url = cleanString(it, 2048)
      if (url) items.push({ id: newItemId('gal'), imageUrl: url, caption: '' })
      continue
    }
    const imageUrl = cleanString(it?.imageUrl, 2048)
    if (!imageUrl) continue
    items.push({
      id: cleanString(it?.id, 64) || newItemId('gal'),
      imageUrl,
      caption: cleanString(it?.caption, 160),
    })
  }
  return {
    ...extractSectionBackground(src, fallback, 'dark'),
    title: cleanString(src.title, 180) || 'Viví la fiesta',
    items,
  }
}

function sanitizeSponsors(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const itemsIn = Array.isArray(src.items) ? src.items : Array.isArray(input) ? input : []
  const items = []
  for (const it of itemsIn.slice(0, 40)) {
    const name = cleanString(it?.name, 160)
    const logoUrl = cleanString(it?.logoUrl, 2048)
    if (!name && !logoUrl) continue
    items.push({
      id: cleanString(it?.id, 64) || newItemId('spo'),
      name: name || 'Auspiciante',
      logoUrl,
      url: cleanString(it?.url, 2048),
      sortOrder: Number.isFinite(Number(it?.sortOrder)) ? Number(it.sortOrder) : items.length,
    })
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    ...extractSectionBackground(src, fallback, 'light'),
    title: cleanString(src.title, 180) || 'Auspician y acompañan',
    items,
  }
}

function sanitizeFestivalStats(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const allowedIcons = new Set([
    'horse',
    'people',
    'music',
    'jineteada',
    'peruvianHorse',
    'food',
    'market',
    'calendar',
    'ticket',
  ])
  const itemsIn = Array.isArray(src.items) ? src.items : []
  const items = []
  for (const it of itemsIn.slice(0, 8)) {
    const valueText = cleanString(it?.valueText, 80)
    let label = cleanString(it?.label, 80)
    const sublabel = cleanString(it?.sublabel, 80)
    if (!label && valueText) label = valueText
    if (!label && sublabel) label = sublabel
    const value = Math.max(0, Math.min(999999, Math.round(Number(it?.value) || 0)))
    if (!label || value <= 0) continue
    const iconRaw = cleanString(it?.icon, 32)
    items.push({
      id: cleanString(it?.id, 64) || newItemId('stat'),
      icon: allowedIcons.has(iconRaw) ? iconRaw : 'horse',
      prefix: cleanString(it?.prefix, 8),
      value,
      label,
      sortOrder: Number.isFinite(Number(it?.sortOrder)) ? Number(it.sortOrder) : items.length,
    })
  }
  items.sort((a, b) => a.sortOrder - b.sortOrder)
  return {
    ...extractSectionBackground(src, fallback, 'light'),
    title: cleanString(src.title, 180),
    subtitle: cleanString(src.subtitle, 280),
    showTitle: src.showTitle === true || src.showTitle === 1,
    items,
  }
}

function sanitizeVisitInfo(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const fb = fallback && typeof fallback === 'object' ? fallback : {}
  const directionsSrc = src.directions && typeof src.directions === 'object' ? src.directions : {}
  const faqSrc = src.faq && typeof src.faq === 'object' ? src.faq : {}
  const sectionBg = extractSectionBackground(src, fb, 'light')

  const faqItemsIn = Array.isArray(faqSrc.items) ? faqSrc.items : []
  const faqItems = []
  for (const it of faqItemsIn.slice(0, 24)) {
    const question = cleanString(it?.question, 280)
    if (!question) continue
    faqItems.push({
      id: cleanString(it?.id, 64) || newItemId('faq'),
      question,
      answer: cleanMultiline(it?.answer, 1200),
      sortOrder: Number.isFinite(Number(it?.sortOrder)) ? Number(it.sortOrder) : faqItems.length,
    })
  }
  faqItems.sort((a, b) => a.sortOrder - b.sortOrder)

  const directionsFallback = fb.directions && typeof fb.directions === 'object' ? fb.directions : {}
  const faqFallback = fb.faq && typeof fb.faq === 'object' ? fb.faq : {}

  return {
    ...sectionBg,
    directions: {
      showTitle:
        directionsSrc.showTitle === true ||
        directionsSrc.showTitle === 1 ||
        (directionsSrc.showTitle == null && directionsFallback.showTitle !== false),
      title:
        cleanString(directionsSrc.title, 180) ||
        cleanString(directionsFallback.title, 180) ||
        '¿Cómo llegar?',
      address: cleanString(directionsSrc.address, 400),
      mapButtonLabel:
        cleanString(directionsSrc.mapButtonLabel, 80) ||
        cleanString(directionsFallback.mapButtonLabel, 80) ||
        'Ver en mapa',
      mapUrl: cleanString(directionsSrc.mapUrl, 2048),
      mapImageUrl: cleanString(directionsSrc.mapImageUrl, 2048),
    },
    faq: {
      showTitle:
        faqSrc.showTitle === true ||
        faqSrc.showTitle === 1 ||
        (faqSrc.showTitle == null && faqFallback.showTitle !== false),
      title:
        cleanString(faqSrc.title, 180) ||
        cleanString(faqFallback.title, 180) ||
        'Preguntas frecuentes',
      ctaLabel: cleanString(faqSrc.ctaLabel, 80),
      ctaHref: cleanString(faqSrc.ctaHref, 2048),
      items: faqItems,
    },
  }
}

function sanitizeHeroCountdown(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : {}
  const fb = fallback && typeof fallback === 'object' ? fallback : {}
  const enabled = src.enabled === true || src.enabled === 1
  let targetAt = cleanString(src.targetAt, 40)
  if (targetAt && !/^\d{4}-\d{2}-\d{2}/.test(targetAt)) {
    targetAt = cleanString(fb.targetAt, 40)
  }
  const clampOffset = (value, fbVal) => {
    const n = Number(value)
    const fbN = Number(fbVal)
    const base = Number.isFinite(n) ? n : Number.isFinite(fbN) ? fbN : 0
    return Math.min(160, Math.max(-160, Math.round(base)))
  }
  return {
    enabled,
    targetAt: targetAt || '',
    offsetYMobile: clampOffset(src.offsetYMobile, fb.offsetYMobile),
    offsetYDesktop: clampOffset(src.offsetYDesktop, fb.offsetYDesktop),
    labelColor: (() => {
      const normalizeHex = (rawIn) => {
        let raw = cleanString(rawIn, 16)
        if (/^[0-9a-fA-F]{6}$/.test(raw)) raw = `#${raw}`
        if (/^[0-9a-fA-F]{3}$/.test(raw)) raw = `#${raw}`
        if (/^#[0-9a-fA-F]{6}$/i.test(raw)) return raw.toLowerCase()
        if (/^#[0-9a-fA-F]{3}$/i.test(raw)) {
          const c = raw.slice(1)
          return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`.toLowerCase()
        }
        return null
      }
      return (
        normalizeHex(src.labelColor) ||
        normalizeHex(fb.labelColor) ||
        '#ffffff'
      )
    })(),
  }
}

function sanitizeFormSection(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : {}
  const fb = fallback && typeof fallback === 'object' ? fallback : {}
  return extractSectionBackground(src, fb, 'dark')
}

function sanitizeUsefulInfo(input, fallback = null) {
  const src = input && typeof input === 'object' ? input : fallback && typeof fallback === 'object' ? fallback : {}
  const itemsIn = Array.isArray(src.items) ? src.items : []
  const items = []
  for (const it of itemsIn.slice(0, 12)) {
    const title = cleanString(it?.title, 120)
    const body = cleanMultiline(it?.body, 800)
    if (!title && !body) continue
    items.push({
      id: cleanString(it?.id, 64) || newItemId('info'),
      title,
      body,
    })
  }
  return {
    title: cleanString(src.title, 180) || 'Información útil',
    items,
  }
}

function todayYmdLocal() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function assertFormWindowOpen(page) {
  const from = page?.formOpenFrom ? String(page.formOpenFrom).slice(0, 10) : null
  const until = page?.formOpenUntil ? String(page.formOpenUntil).slice(0, 10) : null
  const today = todayYmdLocal()
  if (from && today < from) {
    throw new AppError(
      `La preinscripción abre el ${from.split('-').reverse().join('/')}.`,
      403,
    )
  }
  if (until && today > until) {
    throw new AppError(
      `La preinscripción cerró el ${until.split('-').reverse().join('/')}.`,
      403,
    )
  }
}

function sanitizePagePayload(payload, { current } = {}) {
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

  let whatsappMessage
  if (Object.prototype.hasOwnProperty.call(payload || {}, 'whatsappMessage')) {
    const raw = cleanMultiline(payload?.whatsappMessage, 3500)
    whatsappMessage = raw && raw.trim() ? raw : null
  } else {
    const preserved = current?.whatsappMessage
    whatsappMessage =
      preserved != null && String(preserved).trim() !== '' ? String(preserved).trim() : null
  }

  const data = {
    heroEyebrow: heroCover.heroBadge,
    heroTitle: heroCover.heroTitle,
    heroSubtitle: heroCover.heroSubtitle,
    heroSlogan: cleanString(payload?.heroSlogan, 280),
    heroDateBadge: cleanString(payload?.heroDateBadge, 120),
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
    sectionNav: sanitizeSectionNav(
      Object.prototype.hasOwnProperty.call(payload || {}, 'sectionNav')
        ? payload.sectionNav
        : current?.sectionNav,
    ),
    schedule: sanitizeSchedule(
      Object.prototype.hasOwnProperty.call(payload || {}, 'schedule')
        ? payload.schedule
        : undefined,
      current?.schedule,
    ),
    artists: sanitizeArtists(
      Object.prototype.hasOwnProperty.call(payload || {}, 'artists')
        ? payload.artists
        : undefined,
      current?.artists,
    ),
    tickets: sanitizeTickets(
      Object.prototype.hasOwnProperty.call(payload || {}, 'tickets')
        ? payload.tickets
        : undefined,
      current?.tickets,
    ),
    news: sanitizeNews(
      Object.prototype.hasOwnProperty.call(payload || {}, 'news') ? payload.news : undefined,
      current?.news,
    ),
    gallery: sanitizeGallery(
      Object.prototype.hasOwnProperty.call(payload || {}, 'gallery')
        ? payload.gallery
        : undefined,
      current?.gallery,
    ),
    sponsors: sanitizeSponsors(
      Object.prototype.hasOwnProperty.call(payload || {}, 'sponsors')
        ? payload.sponsors
        : undefined,
      current?.sponsors,
    ),
    festivalStats: sanitizeFestivalStats(
      Object.prototype.hasOwnProperty.call(payload || {}, 'festivalStats')
        ? payload.festivalStats
        : undefined,
      current?.festivalStats,
    ),
    visitInfo: sanitizeVisitInfo(
      Object.prototype.hasOwnProperty.call(payload || {}, 'visitInfo')
        ? payload.visitInfo
        : undefined,
      current?.visitInfo,
    ),
    usefulInfo: (() => {
      const formRubros = sanitizeFormRubros(
        Object.prototype.hasOwnProperty.call(payload || {}, 'formRubros')
          ? payload.formRubros
          : undefined,
        current?.formRubros || current?.usefulInfo?.formRubros,
      )
      const formEyebrow = cleanString(
        Object.prototype.hasOwnProperty.call(payload || {}, 'formEyebrow')
          ? payload.formEyebrow
          : current?.formEyebrow || current?.usefulInfo?.formEyebrow,
        120,
      )
      const formHeading = cleanString(
        Object.prototype.hasOwnProperty.call(payload || {}, 'formHeading')
          ? payload.formHeading
          : current?.formHeading || current?.usefulInfo?.formHeading,
        240,
      )
      const heroImageUrlMobile = cleanString(
        Object.prototype.hasOwnProperty.call(payload || {}, 'heroImageUrlMobile')
          ? payload.heroImageUrlMobile
          : current?.heroImageUrlMobile || current?.usefulInfo?.heroImageUrlMobile,
        2048,
      )
      const heroCountdown = sanitizeHeroCountdown(
        Object.prototype.hasOwnProperty.call(payload || {}, 'heroCountdown')
          ? payload.heroCountdown
          : current?.heroCountdown || current?.usefulInfo?.heroCountdown,
        current?.heroCountdown || current?.usefulInfo?.heroCountdown,
      )
      const formSection = sanitizeFormSection(
        Object.prototype.hasOwnProperty.call(payload || {}, 'formSection')
          ? payload.formSection
          : undefined,
        current?.formSection || current?.usefulInfo?.formSection,
      )
      return {
        title: '',
        items: [],
        formRubros,
        formEyebrow,
        formHeading,
        heroImageUrlMobile,
        heroCountdown,
        formSection,
      }
    })(),
    formNotice: cleanMultiline(payload?.formNotice, 2000),
    formRubros: [],
    formEyebrow: '',
    formHeading: '',
    heroImageUrlMobile: '',
    heroCountdown: {
      enabled: false,
      targetAt: '',
      offsetYMobile: 0,
      offsetYDesktop: 0,
      labelColor: '#ffffff',
    },
    formSection: {
      backgroundStyle: 'dark',
      backgroundImageUrl: '',
      overlayOpacity: 55,
    },
    formOpenFrom: cleanDate(payload?.formOpenFrom),
    formOpenUntil: cleanDate(payload?.formOpenUntil),
    ctaTitle: cleanString(payload?.ctaTitle, 240),
    ctaBody: cleanMultiline(payload?.ctaBody, 2500),
    whatsappMessage,
  }

  // Top-level (API) + espejo en usefulInfo (columna JSON que ya existía)
  data.formRubros = data.usefulInfo.formRubros
  data.formEyebrow = data.usefulInfo.formEyebrow
  data.formHeading = data.usefulInfo.formHeading
  data.heroImageUrlMobile = data.usefulInfo.heroImageUrlMobile
  data.heroCountdown = data.usefulInfo.heroCountdown
  data.formSection = data.usefulInfo.formSection

  return data
}

function sanitizeApplicationPayload(payload, allowedRubros = FDC_RUBROS) {
  const fullName = cleanString(payload?.fullName, 180)
  const dni = cleanString(payload?.dni, 20).replace(/[^\d]/g, '')
  const address = cleanString(payload?.address, 320)
  const locality = cleanString(payload?.locality, 160)
  const phone = cleanString(payload?.phone, 80)
  const email = cleanString(payload?.email, 180).toLowerCase()
  let rubro = cleanString(payload?.rubro, 80)
  const rubroOther = cleanString(payload?.rubroOther, 180)
  const participatedBefore = Boolean(payload?.participatedBefore)
  const participationYears = cleanString(payload?.participationYears, 120)
  const rubros = sanitizeFormRubros(allowedRubros, FDC_RUBROS)

  if (!fullName) throw new AppError('El apellido y nombre son obligatorios.', 400)
  if (!dni || dni.length < 7 || dni.length > 10) {
    throw new AppError('El DNI es obligatorio y debe ser válido.', 400)
  }
  if (!address) throw new AppError('El domicilio es obligatorio.', 400)
  if (!locality) throw new AppError('La localidad es obligatoria.', 400)
  if (!phone || phone.length < 6) {
    throw new AppError('El teléfono es obligatorio (mínimo 6 caracteres).', 400)
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('El correo electrónico es obligatorio y debe ser válido.', 400)
  }
  if (!rubros.includes(rubro)) {
    throw new AppError('Seleccioná un rubro válido.', 400)
  }
  if (isOtherRubroLabel(rubro) && !rubroOther) {
    throw new AppError('Indicá el rubro en «Otro».', 400)
  }
  if (participatedBefore && !participationYears) {
    throw new AppError('Indicá el/los año/s de participación anterior.', 400)
  }

  return {
    fullName,
    dni,
    address,
    locality,
    phone,
    email,
    rubro,
    rubroOther: isOtherRubroLabel(rubro) ? rubroOther : '',
    participatedBefore,
    participationYears: participatedBefore ? participationYears : '',
    // Documentación / aviso: solo informativos en el front; se registran como leídos.
    dniCopyAck: true,
    acceptedNotice: true,
    status: 'sin_resolver',
  }
}

function stripInternalPageFields(content) {
  if (!content) return null
  const { whatsappMessage, ...rest } = content
  return rest
}

export async function getFdcPageContentPublic() {
  return stripInternalPageFields(await getFdcPageContentRow())
}

export async function getFdcPageContentAdmin() {
  return getFdcPageContentRow()
}

export async function saveFdcPageContent(payload) {
  const current = await getFdcPageContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'contenido de Fiesta del Caballo',
    Boolean(payload?.forceOverwrite),
  )
  const data = sanitizePagePayload(payload, { current })
  return upsertFdcPageContentRow(data)
}

export async function getFdcWhatsappTemplate() {
  const row = await getFdcPageContentRow()
  if (!row) return { message: '', updatedAt: null }
  return {
    message: row.whatsappMessage || '',
    updatedAt: row.updatedAt,
  }
}

export async function saveFdcWhatsappTemplate({
  message,
  expectedUpdatedAt,
  forceOverwrite = false,
}) {
  const current = await getFdcPageContentRow()
  if (!current) {
    throw new AppError(
      'Todavía no hay contenido de Fiesta del Caballo. Guardalo una vez desde esa sección y reintentá.',
      404,
    )
  }
  assertOptimisticLock(
    expectedUpdatedAt,
    current.updatedAt,
    'plantilla de WhatsApp FDC',
    Boolean(forceOverwrite),
  )
  const cleaned = cleanMultiline(message, 3500)
  await updateFdcWhatsappMessageRow(cleaned || '')
  const next = await getFdcPageContentRow()
  return {
    message: next?.whatsappMessage || '',
    updatedAt: next?.updatedAt,
  }
}

async function sendConfirmationEmail(application) {
  if (!isMailConfigured()) {
    await updateFdcStallApplicationEmailMeta(application.id, {
      emailSentAt: null,
      emailError: 'Correo no configurado en el servidor (BREVO_API_KEY o MAIL_USER/MAIL_PASS).',
    })
    return { sent: false, reason: 'not_configured' }
  }
  try {
    const mail = buildFdcStallConfirmationEmail(application)
    await sendMail({
      to: application.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    })
    await updateFdcStallApplicationEmailMeta(application.id, {
      emailSentAt: new Date(),
      emailError: '',
    })
    return { sent: true }
  } catch (e) {
    const msg = e?.message || 'No se pudo enviar el correo.'
    console.error('[fdc] email error:', msg)
    await updateFdcStallApplicationEmailMeta(application.id, {
      emailSentAt: null,
      emailError: msg,
    })
    return { sent: false, reason: msg }
  }
}

function queueConfirmationEmail(application) {
  // Nunca bloquear la respuesta HTTP con SMTP (Gmail puede tardar 10–20s).
  setImmediate(() => {
    void sendConfirmationEmail(application).catch((err) => {
      console.error('[fdc] confirmation email failed:', err?.message || err)
    })
  })
}

export async function createFdcStallApplication(payload) {
  const page = await getFdcPageContentRow()
  assertFormWindowOpen(page)
  const data = sanitizeApplicationPayload(payload, resolveAllowedRubros(page))

  const duplicate = await findFdcStallDuplicateByContact({
    email: data.email,
    phone: data.phone,
  })
  if (duplicate?.field === 'email') {
    throw new AppError(
      `Ya se registró una preinscripción con este correo electrónico (solicitud N° ${duplicate.application.id}). Si necesitás corregir datos, comunicate con la municipalidad.`,
      409,
    )
  }
  if (duplicate?.field === 'phone') {
    throw new AppError(
      `Ya se registró una preinscripción con este número de teléfono (solicitud N° ${duplicate.application.id}). Si necesitás corregir datos, comunicate con la municipalidad.`,
      409,
    )
  }

  const created = await createFdcStallApplicationRow(data)
  const emailQueued = isMailConfigured()
  queueConfirmationEmail(created)

  return {
    application: created,
    emailSent: false,
    emailQueued,
    emailError: '',
  }
}

export async function listFdcStallApplicationsAdmin({ status = '' } = {}) {
  return listFdcStallApplications({ status })
}

export async function getFdcStallApplicationAdmin(id) {
  const row = await findFdcStallApplicationById(id)
  if (!row) throw new AppError('Solicitud no encontrada.', 404)
  return row
}

export async function setFdcStallApplicationStatus(
  id,
  status,
  expectedUpdatedAt,
  forceOverwrite = false,
) {
  const current = await findFdcStallApplicationById(id)
  if (!current) throw new AppError('Solicitud no encontrada.', 404)
  assertOptimisticLock(
    expectedUpdatedAt,
    current.updatedAt,
    'solicitud de puesto FDC',
    Boolean(forceOverwrite),
  )
  const nextStatus = cleanString(status, 24).toLowerCase()
  if (!ALLOWED_STATUS.has(nextStatus)) {
    throw new AppError('Estado no válido.', 400)
  }
  return updateFdcStallApplicationStatusRow(id, nextStatus)
}

export async function removeFdcStallApplication(id) {
  const ok = await deleteFdcStallApplicationRow(id)
  if (!ok) throw new AppError('Solicitud no encontrada.', 404)
}

export async function resendFdcStallConfirmationEmail(id) {
  const application = await findFdcStallApplicationById(id)
  if (!application) throw new AppError('Solicitud no encontrada.', 404)
  const result = await sendConfirmationEmail(application)
  const fresh = await findFdcStallApplicationById(id)
  if (!result.sent) {
    throw new AppError(
      result.reason === 'not_configured'
        ? 'El correo no está configurado en el servidor.'
        : result.reason || 'No se pudo reenviar el correo.',
      503,
    )
  }
  return fresh
}
