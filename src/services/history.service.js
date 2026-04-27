import { getHistoryContentRow, upsertHistoryContentRow } from '../models/history.model.js'

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

function sanitizePayload(payload) {
  return {
    heroBadge: cleanString(payload?.heroBadge, 120),
    heroTitle: cleanString(payload?.heroTitle, 180),
    heroSubtitle: cleanString(payload?.heroSubtitle, 1200),
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    introStory: cleanMultiline(payload?.introStory, 7000),
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
  const data = sanitizePayload(payload)
  return upsertHistoryContentRow(data)
}
