import {
  getAreasPageContentRow,
  upsertAreasPageContentRow,
} from '../models/areasPage.model.js'

function cleanString(value, maxLen = 0) {
  const out = String(value || '').trim()
  if (!maxLen) return out
  return out.slice(0, maxLen)
}

function cleanUrl(value, maxLen = 2048) {
  const out = cleanString(value, maxLen)
  if (!out) return ''
  if (out.startsWith('http://') || out.startsWith('https://') || out.startsWith('/')) {
    return out
  }
  return ''
}

export async function getAreasPageContent() {
  return getAreasPageContentRow()
}

export async function saveAreasPageContent(payload) {
  return upsertAreasPageContentRow({
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
  })
}
