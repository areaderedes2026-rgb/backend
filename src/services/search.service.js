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

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function parseJsonSafe(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function projectSearchText(project) {
  return [
    project?.title,
    project?.description,
    project?.status,
    project?.linkLabel,
  ].join(' ')
}

function serviceSearchText(service) {
  return [
    service?.id,
    service?.title,
    service?.description,
    service?.mode,
    service?.personInCharge,
    service?.generalObjective,
    ...(Array.isArray(service?.projects) ? service.projects.map(projectSearchText) : []),
  ].join(' ')
}

function serviceSubtitle(areaTitle, service, normalizedQuery) {
  const projects = Array.isArray(service?.projects) ? service.projects : []
  const matchingProject = projects.find((project) =>
    normalizeText(projectSearchText(project)).includes(normalizedQuery),
  )
  const parts = [
    areaTitle ? `Área: ${areaTitle}` : '',
    service?.mode || '',
    matchingProject?.title ? `Proyecto: ${matchingProject.title}` : '',
  ].filter(Boolean)
  const context = excerpt(
    matchingProject?.description ||
      service?.description ||
      service?.generalObjective ||
      service?.personInCharge,
    120,
  )
  return [parts.join(' · '), context].filter(Boolean).join(' — ')
}

/**
 * @param {string} normalized
 * @returns {Promise<Array<{ kind: string, id: string, title: string, subtitle: string, path: string }>>}
 */
export async function runGlobalSearch(normalized) {
  const { newsRows, eventRows, areaRows, profileRows, areaServiceRows, tourismRows } =
    await searchPublicDatabase(normalized)
  const normalizedQuery = normalizeText(normalized)

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

  for (const r of areaServiceRows || []) {
    const slug = String(r.slug || '')
    if (!slug) continue
    const services = parseJsonSafe(r.services_json, [])
    if (!Array.isArray(services)) continue
    services
      .map((service, idx) => ({ service, idx }))
      .filter(({ service }) => normalizeText(serviceSearchText(service)).includes(normalizedQuery))
      .sort((a, b) => {
        const oa = Math.max(0, Math.round(Number(a.service?.sortOrder)) || 0)
        const ob = Math.max(0, Math.round(Number(b.service?.sortOrder)) || 0)
        if (oa !== ob) return oa - ob
        return a.idx - b.idx
      })
      .slice(0, 4)
      .forEach(({ service }) => {
        const serviceId = String(service?.id || '').trim()
        const title = String(service?.title || '').trim()
        if (!serviceId || !title) return
        add({
          kind: 'area_service',
          id: `${slug}:${serviceId}`,
          title,
          subtitle: serviceSubtitle(String(r.title || slug), service, normalizedQuery),
          path: `/areas/${encodeURIComponent(slug)}?serviceId=${encodeURIComponent(serviceId)}#servicios-area`,
        })
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
