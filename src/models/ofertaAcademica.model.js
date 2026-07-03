import { pool } from '../config/db.js'

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

function mapOfertaAcademicaRow(row) {
  if (!row) return null
  return {
    heroEyebrow: row.hero_eyebrow || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroImageUrl: row.hero_image_url || '',
    overlayOpacity: Number.isFinite(Number(row.hero_overlay_opacity))
      ? Math.min(90, Math.max(0, Math.round(Number(row.hero_overlay_opacity))))
      : 65,
    heroPrimaryLabel: row.hero_primary_label || '',
    heroPrimaryHref: row.hero_primary_href || '',
    heroSecondaryLabel: row.hero_secondary_label || '',
    heroSecondaryHref: row.hero_secondary_href || '',
    heroSearchPlaceholder: row.hero_search_placeholder || '',
    showHeroBadge: row.show_hero_badge !== 0,
    showHeroTitle: row.show_hero_title !== 0,
    showHeroSubtitle: row.show_hero_subtitle !== 0,
    showSearch: row.show_search !== 0,
    showPrimaryButton: row.show_primary_button !== 0,
    showSecondaryButton: row.show_secondary_button !== 0,
    introTitle: row.intro_title || '',
    introParagraphs: parseJsonSafe(row.intro_paragraphs_json, []),
    highlights: parseJsonSafe(row.highlights_json, []),
    categories: parseJsonSafe(row.categories_json, []),
    offers: parseJsonSafe(row.offers_json, []),
    ctaTitle: row.cta_title || '',
    ctaBody: row.cta_body || '',
    updatedAt: row.updated_at || null,
  }
}

export async function getOfertaAcademicaContentRow() {
  const [rows] = await pool.query(
    'SELECT * FROM oferta_academica_content WHERE id = 1 LIMIT 1',
  )
  return mapOfertaAcademicaRow(rows[0] ?? null)
}

export async function upsertOfertaAcademicaContentRow(payload) {
  await pool.query(
    `INSERT INTO oferta_academica_content (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_image_url,
      hero_overlay_opacity,
      hero_primary_label,
      hero_primary_href,
      hero_secondary_label,
      hero_secondary_href,
      hero_search_placeholder,
      show_hero_badge,
      show_hero_title,
      show_hero_subtitle,
      show_search,
      show_primary_button,
      show_secondary_button,
      intro_title,
      intro_paragraphs_json,
      highlights_json,
      categories_json,
      offers_json,
      cta_title,
      cta_body
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
      hero_overlay_opacity = VALUES(hero_overlay_opacity),
      hero_primary_label = VALUES(hero_primary_label),
      hero_primary_href = VALUES(hero_primary_href),
      hero_secondary_label = VALUES(hero_secondary_label),
      hero_secondary_href = VALUES(hero_secondary_href),
      hero_search_placeholder = VALUES(hero_search_placeholder),
      show_hero_badge = VALUES(show_hero_badge),
      show_hero_title = VALUES(show_hero_title),
      show_hero_subtitle = VALUES(show_hero_subtitle),
      show_search = VALUES(show_search),
      show_primary_button = VALUES(show_primary_button),
      show_secondary_button = VALUES(show_secondary_button),
      intro_title = VALUES(intro_title),
      intro_paragraphs_json = VALUES(intro_paragraphs_json),
      highlights_json = VALUES(highlights_json),
      categories_json = VALUES(categories_json),
      offers_json = VALUES(offers_json),
      cta_title = VALUES(cta_title),
      cta_body = VALUES(cta_body),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroEyebrow,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroImageUrl,
      Math.min(
        90,
        Math.max(
          0,
          Math.round(
            Number.isFinite(Number(payload.overlayOpacity))
              ? Number(payload.overlayOpacity)
              : 65,
          ),
        ),
      ),
      payload.heroPrimaryLabel,
      payload.heroPrimaryHref,
      payload.heroSecondaryLabel,
      payload.heroSecondaryHref,
      payload.heroSearchPlaceholder,
      payload.showHeroBadge !== false ? 1 : 0,
      payload.showHeroTitle !== false ? 1 : 0,
      payload.showHeroSubtitle !== false ? 1 : 0,
      payload.showSearch !== false ? 1 : 0,
      payload.showPrimaryButton === true ? 1 : 0,
      payload.showSecondaryButton === true ? 1 : 0,
      payload.introTitle,
      JSON.stringify(payload.introParagraphs),
      JSON.stringify(payload.highlights),
      JSON.stringify(payload.categories),
      JSON.stringify(payload.offers),
      payload.ctaTitle,
      payload.ctaBody,
    ],
  )
  return getOfertaAcademicaContentRow()
}
