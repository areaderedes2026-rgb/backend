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

function mapHistoryRow(row) {
  if (!row) return null
  return {
    heroBadge: row.hero_badge || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroImageUrl: row.hero_image_url || '',
    introStory: row.intro_story_text || '',
    ctaPrimaryLabel: row.cta_primary_label || '',
    ctaPrimaryHref: row.cta_primary_href || '',
    ctaSecondaryLabel: row.cta_secondary_label || '',
    ctaSecondaryHref: row.cta_secondary_href || '',
    legacyItems: parseJsonSafe(row.legacy_items_json, []),
    tourismCategories: parseJsonSafe(row.tourism_categories_json, []),
    tourismSpots: parseJsonSafe(row.tourism_spots_json, []),
    closingTitle: row.closing_title || '',
    closingText: row.closing_text || '',
    updatedAt: row.updated_at,
  }
}

export async function getHistoryContentRow() {
  const [rows] = await pool.query('SELECT * FROM history_content WHERE id = 1 LIMIT 1')
  return mapHistoryRow(rows[0] ?? null)
}

export async function upsertHistoryContentRow(payload) {
  await pool.query(
    `INSERT INTO history_content (
      id,
      hero_badge,
      hero_title,
      hero_subtitle,
      hero_image_url,
      intro_story_text,
      cta_primary_label,
      cta_primary_href,
      cta_secondary_label,
      cta_secondary_href,
      legacy_items_json,
      tourism_categories_json,
      tourism_spots_json,
      closing_title,
      closing_text
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_badge = VALUES(hero_badge),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
      intro_story_text = VALUES(intro_story_text),
      cta_primary_label = VALUES(cta_primary_label),
      cta_primary_href = VALUES(cta_primary_href),
      cta_secondary_label = VALUES(cta_secondary_label),
      cta_secondary_href = VALUES(cta_secondary_href),
      legacy_items_json = VALUES(legacy_items_json),
      tourism_categories_json = VALUES(tourism_categories_json),
      tourism_spots_json = VALUES(tourism_spots_json),
      closing_title = VALUES(closing_title),
      closing_text = VALUES(closing_text),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroBadge,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroImageUrl,
      payload.introStory,
      payload.ctaPrimaryLabel,
      payload.ctaPrimaryHref,
      payload.ctaSecondaryLabel,
      payload.ctaSecondaryHref,
      JSON.stringify(payload.legacyItems),
      JSON.stringify(payload.tourismCategories),
      JSON.stringify(payload.tourismSpots),
      payload.closingTitle,
      payload.closingText,
    ],
  )
  return getHistoryContentRow()
}
