function cleanString(value, maxLen = 0) {
  const out = String(value ?? '').trim()
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

function cleanUrl(value, maxLen = 2048) {
  const out = cleanString(value, maxLen)
  if (!out) return ''
  if (out.startsWith('http://') || out.startsWith('https://') || out.startsWith('/') || out.startsWith('#')) {
    return out
  }
  return ''
}

export function mapPageHeroCoverRow(row, { pageKey } = {}) {
  if (!row) return null
  const rawOpacity = Number(row.hero_overlay_opacity)
  const overlayOpacity = Number.isFinite(rawOpacity)
    ? Math.min(90, Math.max(0, Math.round(rawOpacity)))
    : 65
  return {
    ...(pageKey ? { pageKey } : {}),
    heroImageUrl: row.hero_image_url || '',
    overlayOpacity,
    heroBadge: row.hero_badge || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroSearchPlaceholder: row.hero_search_placeholder || '',
    showHeroBadge: row.show_hero_badge !== 0,
    showHeroTitle: row.show_hero_title !== 0,
    showHeroSubtitle: row.show_hero_subtitle !== 0,
    showSearch: row.show_search !== 0,
    showPrimaryButton: row.show_primary_button !== 0,
    primaryLabel: row.primary_label || '',
    primaryHref: row.primary_href || '',
    showSecondaryButton: row.show_secondary_button !== 0,
    secondaryLabel: row.secondary_label || '',
    secondaryHref: row.secondary_href || '',
    updatedAt: row.updated_at || null,
  }
}

export function sanitizePageHeroCoverPayload(payload, { current } = {}) {
  const overlayFallback = current?.overlayOpacity ?? 65
  return {
    heroImageUrl: cleanUrl(payload?.heroImageUrl, 2048),
    overlayOpacity: Math.min(
      90,
      Math.max(0, Math.round(cleanNumber(payload?.overlayOpacity, overlayFallback))),
    ),
    heroBadge: cleanString(payload?.heroBadge, 120),
    heroTitle: cleanString(payload?.heroTitle, 180),
    heroSubtitle: String(payload?.heroSubtitle ?? '').trim().slice(0, 2000),
    heroSearchPlaceholder: cleanString(payload?.heroSearchPlaceholder, 180),
    showHeroBadge: cleanBool(payload?.showHeroBadge, current?.showHeroBadge ?? true),
    showHeroTitle: cleanBool(payload?.showHeroTitle, current?.showHeroTitle ?? true),
    showHeroSubtitle: cleanBool(payload?.showHeroSubtitle, current?.showHeroSubtitle ?? true),
    showSearch: cleanBool(payload?.showSearch, current?.showSearch ?? true),
    showPrimaryButton: cleanBool(payload?.showPrimaryButton, current?.showPrimaryButton ?? false),
    primaryLabel: cleanString(payload?.primaryLabel, 80),
    primaryHref: cleanUrl(payload?.primaryHref, 2048),
    showSecondaryButton: cleanBool(payload?.showSecondaryButton, current?.showSecondaryButton ?? false),
    secondaryLabel: cleanString(payload?.secondaryLabel, 80),
    secondaryHref: cleanUrl(payload?.secondaryHref, 2048),
  }
}
