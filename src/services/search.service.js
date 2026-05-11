import { searchPublicDatabase } from '../models/search.model.js'

export function normalizeSearchQuery(q) {
  const s = String(q || '')
    .trim()
    .slice(0, 100)
    .replace(/[%_\\]/g, '')
  if (s.length < 2) return null
  return s
}

function excerpt(text, max = 130) {
  const t = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trimEnd()}…`
}

/**
 * @param {string} normalized
 * @returns {Promise<Array<{ kind: string, id: string, title: string, subtitle: string, path: string }>>}
 */
export async function runGlobalSearch(normalized) {
  const { newsRows, eventRows, areaRows, profileRows, tourismRows } =
    await searchPublicDatabase(normalized)

  const byPath = new Map()

  function add(item) {
    if (!item?.path) return
    if (byPath.has(item.path)) return
    byPath.set(item.path, item)
  }

  for (const r of newsRows) {
    add({
      kind: 'news',
      id: String(r.id),
      title: String(r.title || ''),
      subtitle: excerpt(r.snippet, 140),
      path: `/news/${r.id}`,
    })
  }

  for (const r of eventRows) {
    const when = r.event_date ? new Date(r.event_date).toLocaleString('es-AR') : ''
    add({
      kind: 'event',
      id: String(r.id),
      title: String(r.title || ''),
      subtitle: [r.place, when].filter(Boolean).join(' · '),
      path: `/eventos?eventId=${encodeURIComponent(r.id)}`,
    })
  }

  const areaSlugs = new Set()
  for (const r of areaRows) {
    const slug = String(r.slug || '')
    areaSlugs.add(slug)
    add({
      kind: 'area',
      id: slug,
      title: String(r.title || slug),
      subtitle: excerpt(r.snippet, 120),
      path: `/areas/${encodeURIComponent(slug)}`,
    })
  }

  for (const r of profileRows) {
    const slug = String(r.slug || '')
    if (areaSlugs.has(slug)) continue
    const sub = excerpt(r.hero_tag || r.mission, 140)
    if (!sub) continue
    add({
      kind: 'area',
      id: slug,
      title: String(r.title || slug),
      subtitle: sub,
      path: `/areas/${encodeURIComponent(slug)}`,
    })
  }

  for (const r of tourismRows) {
    const slug = String(r.slug || '')
    add({
      kind: 'tourism',
      id: slug,
      title: String(r.name || ''),
      subtitle: excerpt(r.snippet, 120),
      path: `/history/lugares/${encodeURIComponent(slug)}`,
    })
  }

  return [...byPath.values()]
}
