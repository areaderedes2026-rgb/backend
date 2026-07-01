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

const DEFAULT_SECTION_VISIBILITY = {
  storySections: true,
  legacyCards: true,
  documentary: true,
  closing: true,
}

const DEFAULT_DOCUMENTARY = {
  title: '',
  description: '',
  chapters: [],
}

function mapHistoryRow(row) {
  if (!row) return null
  return {
    heroBadge: row.hero_badge || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroSearchPlaceholder: row.hero_search_placeholder || '',
    heroImageUrl: row.hero_image_url || '',
    introStory: row.intro_story_text || '',
    storySections: parseJsonSafe(row.story_sections_json, []),
    ctaPrimaryLabel: row.cta_primary_label || '',
    ctaPrimaryHref: row.cta_primary_href || '',
    ctaSecondaryLabel: row.cta_secondary_label || '',
    ctaSecondaryHref: row.cta_secondary_href || '',
    legacyItems: parseJsonSafe(row.legacy_items_json, []),
    sectionVisibility: parseJsonSafe(row.section_visibility_json, DEFAULT_SECTION_VISIBILITY),
    documentary: parseJsonSafe(row.documentary_json, DEFAULT_DOCUMENTARY),
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
      hero_search_placeholder,
      hero_image_url,
      intro_story_text,
      story_sections_json,
      cta_primary_label,
      cta_primary_href,
      cta_secondary_label,
      cta_secondary_href,
      legacy_items_json,
      section_visibility_json,
      documentary_json,
      tourism_categories_json,
      tourism_spots_json,
      closing_title,
      closing_text
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_badge = VALUES(hero_badge),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_search_placeholder = VALUES(hero_search_placeholder),
      hero_image_url = VALUES(hero_image_url),
      intro_story_text = VALUES(intro_story_text),
      story_sections_json = VALUES(story_sections_json),
      cta_primary_label = VALUES(cta_primary_label),
      cta_primary_href = VALUES(cta_primary_href),
      cta_secondary_label = VALUES(cta_secondary_label),
      cta_secondary_href = VALUES(cta_secondary_href),
      legacy_items_json = VALUES(legacy_items_json),
      section_visibility_json = VALUES(section_visibility_json),
      documentary_json = VALUES(documentary_json),
      tourism_categories_json = VALUES(tourism_categories_json),
      tourism_spots_json = VALUES(tourism_spots_json),
      closing_title = VALUES(closing_title),
      closing_text = VALUES(closing_text),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroBadge,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroSearchPlaceholder,
      payload.heroImageUrl,
      payload.introStory,
      JSON.stringify(payload.storySections),
      payload.ctaPrimaryLabel,
      payload.ctaPrimaryHref,
      payload.ctaSecondaryLabel,
      payload.ctaSecondaryHref,
      JSON.stringify(payload.legacyItems),
      JSON.stringify(payload.sectionVisibility),
      JSON.stringify(payload.documentary),
      JSON.stringify(payload.tourismCategories),
      JSON.stringify(payload.tourismSpots),
      payload.closingTitle,
      payload.closingText,
    ],
  )
  return getHistoryContentRow()
}
