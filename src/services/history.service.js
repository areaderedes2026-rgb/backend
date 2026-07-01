import { getHistoryContentRow, upsertHistoryContentRow } from '../models/history.model.js'
import { assertOptimisticLock } from '../utils/concurrency.js'

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
  if (out.startsWith('http://') || out.startsWith('https://') || out.startsWith('#')) return out
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

function cleanBool(value, fallback = true) {
  if (value === false) return false
  if (value === true) return true
  return fallback
}

function sanitizeSectionVisibility(raw) {
  const base = {
    storySections: true,
    legacyCards: true,
    documentary: true,
    closing: true,
  }
  if (!raw || typeof raw !== 'object') return base
  const storyVisible = cleanBool(raw.storySections, true) && cleanBool(raw.introStory, true)
  return {
    storySections: storyVisible,
    legacyCards: cleanBool(raw.legacyCards, base.legacyCards),
    documentary: cleanBool(raw.documentary, base.documentary),
    closing: cleanBool(raw.closing, base.closing),
  }
}

function sanitizeStorySections(raw) {
  const rawSections = Array.isArray(raw) ? raw.slice(0, 30) : []
  const sections = []
  for (let index = 0; index < rawSections.length; index += 1) {
    const item = rawSections[index]
    const title = cleanString(item?.title, 180)
    if (!title) continue
    const id = cleanString(item?.id, 60) || `story-${index + 1}`
    const subtitle = cleanString(item?.subtitle, 280)
    const paragraphs = cleanList(
      item?.paragraphs,
      (paragraph) => {
        const text = cleanMultiline(paragraph, 4000)
        return text || null
      },
      30,
    )
    const images = []
    const rawImages = Array.isArray(item?.images) ? item.images.slice(0, 12) : []
    for (let imageIndex = 0; imageIndex < rawImages.length; imageIndex += 1) {
      const image = rawImages[imageIndex]
      const imageUrl = cleanUrl(image?.imageUrl || image?.url, 2048)
      const caption = cleanString(image?.caption, 220)
      if (!imageUrl && !caption) continue
      images.push({
        id: cleanString(image?.id, 60) || `hist-img-${index + 1}-${imageIndex + 1}`,
        imageUrl,
        caption,
        sortOrder: Number.isFinite(Number(image?.sortOrder))
          ? Math.max(Number(image.sortOrder), 0)
          : (imageIndex + 1) * 10,
      })
    }
    images.sort((a, b) => a.sortOrder - b.sortOrder)
    const sortOrder = Number.isFinite(Number(item?.sortOrder))
      ? Math.max(Number(item.sortOrder), 0)
      : (index + 1) * 10
    sections.push({ id, title, subtitle, paragraphs, images, sortOrder })
  }
  sections.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'es'))
  return sections
}

function sanitizeDocumentary(raw) {
  const title = cleanString(raw?.title, 180)
  const description = cleanMultiline(raw?.description, 2000)
  const rawChapters = Array.isArray(raw?.chapters) ? raw.chapters.slice(0, 40) : []
  const chapters = []
  for (let index = 0; index < rawChapters.length; index += 1) {
    const item = rawChapters[index]
    const chapterTitle = cleanString(item?.title, 180)
    if (!chapterTitle) continue
    const id = cleanString(item?.id, 60) || `doc-ch-${index + 1}`
    const driveUrl = cleanUrl(item?.driveUrl || item?.linkUrl, 2048)
    const sortOrder = Number.isFinite(Number(item?.sortOrder))
      ? Math.max(Number(item.sortOrder), 0)
      : (index + 1) * 10
    chapters.push({
      id,
      title: chapterTitle,
      description: cleanString(item?.description, 800),
      driveUrl,
      sortOrder,
    })
  }
  chapters.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, 'es'))
  return { title, description, chapters }
}

function sanitizePayload(payload) {
  const storySections = sanitizeStorySections(payload?.storySections)
  const introStory =
    storySections[0]?.paragraphs?.join('\n\n') || cleanMultiline(payload?.introStory, 7000)

  return {
    heroBadge: cleanString(payload?.heroBadge, 120),
    heroTitle: cleanString(payload?.heroTitle, 180),
    heroSubtitle: cleanString(payload?.heroSubtitle, 1200),
    heroSearchPlaceholder: cleanString(payload?.heroSearchPlaceholder, 180),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    introStory,
    storySections,
    ctaPrimaryLabel: cleanString(payload?.ctaPrimaryLabel, 80),
    ctaPrimaryHref: cleanUrl(payload?.ctaPrimaryHref, 2048),
    ctaSecondaryLabel: cleanString(payload?.ctaSecondaryLabel, 80),
    ctaSecondaryHref: cleanUrl(payload?.ctaSecondaryHref, 2048),
    legacyItems: cleanList(
      payload?.legacyItems,
      (item) => {
        const title = cleanString(item?.title, 140)
        const text = cleanString(item?.text, 800)
        if (!title && !text) return null
        return { title, text }
      },
      12,
    ),
    sectionVisibility: sanitizeSectionVisibility(payload?.sectionVisibility),
    documentary: sanitizeDocumentary(payload?.documentary),
    tourismCategories: cleanList(
      payload?.tourismCategories,
      (item) => {
        const id = cleanString(item?.id, 40).toLowerCase()
        const label = cleanString(item?.label, 80)
        if (!id && !label) return null
        return { id: id || `category-${Math.random().toString(36).slice(2, 9)}`, label }
      },
      30,
    ),
    tourismSpots: cleanList(
      payload?.tourismSpots,
      (item) => {
        const id = cleanString(item?.id, 40).toLowerCase()
        const name = cleanString(item?.name, 140)
        const category = cleanString(item?.category, 40).toLowerCase()
        const image = cleanUrl(item?.image, 2048)
        const summary = cleanString(item?.summary, 1200)
        const chips = cleanList(
          item?.chips,
          (chip) => {
            const value = cleanString(chip, 60)
            return value || null
          },
          8,
        )
        if (!id && !name && !summary) return null
        return {
          id: id || `spot-${Math.random().toString(36).slice(2, 9)}`,
          name,
          category,
          image,
          summary,
          chips,
        }
      },
      60,
    ),
    closingTitle: cleanString(payload?.closingTitle, 180),
    closingText: cleanMultiline(payload?.closingText, 2000),
  }
}

export async function getHistoryContent() {
  return getHistoryContentRow()
}

export async function saveHistoryContent(payload) {
  const current = await getHistoryContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'contenido de historia',
    Boolean(payload?.forceOverwrite),
  )
  const data = sanitizePayload(payload)
  return upsertHistoryContentRow(data)
}
