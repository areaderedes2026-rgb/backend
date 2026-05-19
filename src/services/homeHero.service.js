import { getHomeHeroContentRow, upsertHomeHeroContentRow } from '../models/homeHero.model.js'
import { assertOptimisticLock } from '../utils/concurrency.js'

const TEXT_ALIGNS = new Set(['left', 'center', 'right'])
const DISPLAY_MODES = new Set(['single', 'carousel'])

function cleanText(value, maxLen = 0) {
  const out = String(value || '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanNumber(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function cleanBool(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (value === 0 || value === '0' || value === 'false') return false
  if (value === 1 || value === '1' || value === 'true') return true
  return fallback
}

function cleanAlign(value, fallback = 'left') {
  return TEXT_ALIGNS.has(value) ? value : fallback
}

function sanitizeSlide(raw, index) {
  const title = cleanText(raw?.title, 180)
  const imageUrl = cleanText(raw?.imageUrl, 2048)
  const mobileImageUrl = cleanText(raw?.mobileImageUrl, 2048)
  const eyebrow = cleanText(raw?.eyebrow, 120)
  const subtitle = cleanText(raw?.subtitle, 600)

  if (!title && !imageUrl && !mobileImageUrl && !eyebrow && !subtitle) return null

  const fallbackId = `banner-${index + 1}`
  const id = cleanText(raw?.id, 80) || fallbackId
  const legacyAlign = cleanAlign(raw?.textAlign, 'left')
  const desktopTextAlign = cleanAlign(raw?.desktopTextAlign, legacyAlign)
  const mobileTextAlign = cleanAlign(raw?.mobileTextAlign, desktopTextAlign)

  return {
    id,
    eyebrow,
    title,
    subtitle,
    imageUrl,
    mobileImageUrl,
    imageAlt: cleanText(raw?.imageAlt, 180),
    overlayOpacity: Math.min(90, Math.max(0, Math.round(cleanNumber(raw?.overlayOpacity, 65)))),
    showEyebrow: cleanBool(raw?.showEyebrow, Boolean(eyebrow)),
    showTitle: cleanBool(raw?.showTitle, Boolean(title)),
    showSubtitle: cleanBool(raw?.showSubtitle, Boolean(subtitle)),
    showPrimaryButton: cleanBool(raw?.showPrimaryButton, true),
    primaryLabel: cleanText(raw?.primaryLabel, 80),
    primaryHref: cleanText(raw?.primaryHref, 2048),
    showSecondaryButton: cleanBool(raw?.showSecondaryButton, true),
    secondaryLabel: cleanText(raw?.secondaryLabel, 80),
    secondaryHref: cleanText(raw?.secondaryHref, 2048),
    textAlign: desktopTextAlign,
    desktopTextAlign,
    mobileTextAlign,
    isActive: cleanBool(raw?.isActive, true),
    sortOrder: Math.max(0, Math.round(cleanNumber(raw?.sortOrder, index * 10))),
  }
}

function sanitizePayload(payload) {
  const slides = Array.isArray(payload?.slides)
    ? payload.slides.map((slide, idx) => sanitizeSlide(slide, idx)).filter(Boolean).slice(0, 12)
    : []

  const displayMode = DISPLAY_MODES.has(payload?.displayMode) ? payload.displayMode : 'single'
  const activeSlideId = cleanText(payload?.activeSlideId, 80)
  const activeExists = slides.some((slide) => slide.id === activeSlideId)

  return {
    displayMode,
    activeSlideId: activeExists ? activeSlideId : slides[0]?.id || '',
    autoplayEnabled: cleanBool(payload?.autoplayEnabled, true),
    autoplaySeconds: Math.min(30, Math.max(3, Math.round(cleanNumber(payload?.autoplaySeconds, 6)))),
    slides,
  }
}

export async function getHomeHeroContent() {
  return getHomeHeroContentRow()
}

export async function saveHomeHeroContent(payload) {
  const current = await getHomeHeroContentRow()
  assertOptimisticLock(payload?.expectedUpdatedAt, current?.updatedAt, 'hero de inicio')
  const data = sanitizePayload(payload)
  return upsertHomeHeroContentRow(data)
}
