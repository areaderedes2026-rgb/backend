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

function mapContentRow(row) {
  if (!row) return null
  return {
    heroEyebrow: row.hero_eyebrow || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroImageUrl: row.hero_image_url || '',
    heroPrimaryLabel: row.hero_primary_label || '',
    heroPrimaryHref: row.hero_primary_href || '',
    heroSecondaryLabel: row.hero_secondary_label || '',
    heroSecondaryHref: row.hero_secondary_href || '',
    steps: parseJsonSafe(row.steps_json, []),
    scheduleLines: parseJsonSafe(row.schedule_lines_json, []),
    categories: parseJsonSafe(row.categories_json, []),
    proceduresEyebrow: row.procedures_eyebrow || '',
    proceduresTitle: row.procedures_title || '',
    faq: parseJsonSafe(row.faq_json, []),
    finalCtaTitle: row.final_cta_title || '',
    finalCtaText: row.final_cta_text || '',
    finalPrimaryLabel: row.final_primary_label || '',
    finalPrimaryHref: row.final_primary_href || '',
    finalSecondaryLabel: row.final_secondary_label || '',
    finalSecondaryHref: row.final_secondary_href || '',
    updatedAt: row.updated_at,
  }
}

export async function getServicesPageContentRow() {
  const [rows] = await pool.query('SELECT * FROM services_page_content WHERE id = 1 LIMIT 1')
  return mapContentRow(rows[0] ?? null)
}

export async function upsertServicesPageContentRow(payload) {
  await pool.query(
    `INSERT INTO services_page_content (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_image_url,
      hero_primary_label,
      hero_primary_href,
      hero_secondary_label,
      hero_secondary_href,
      steps_json,
      schedule_lines_json,
      categories_json,
      procedures_eyebrow,
      procedures_title,
      faq_json,
      final_cta_title,
      final_cta_text,
      final_primary_label,
      final_primary_href,
      final_secondary_label,
      final_secondary_href
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
      hero_primary_label = VALUES(hero_primary_label),
      hero_primary_href = VALUES(hero_primary_href),
      hero_secondary_label = VALUES(hero_secondary_label),
      hero_secondary_href = VALUES(hero_secondary_href),
      steps_json = VALUES(steps_json),
      schedule_lines_json = VALUES(schedule_lines_json),
      categories_json = VALUES(categories_json),
      procedures_eyebrow = VALUES(procedures_eyebrow),
      procedures_title = VALUES(procedures_title),
      faq_json = VALUES(faq_json),
      final_cta_title = VALUES(final_cta_title),
      final_cta_text = VALUES(final_cta_text),
      final_primary_label = VALUES(final_primary_label),
      final_primary_href = VALUES(final_primary_href),
      final_secondary_label = VALUES(final_secondary_label),
      final_secondary_href = VALUES(final_secondary_href)`,
    [
      payload.heroEyebrow,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroImageUrl,
      payload.heroPrimaryLabel,
      payload.heroPrimaryHref,
      payload.heroSecondaryLabel,
      payload.heroSecondaryHref,
      JSON.stringify(payload.steps),
      JSON.stringify(payload.scheduleLines),
      JSON.stringify(payload.categories),
      payload.proceduresEyebrow,
      payload.proceduresTitle,
      JSON.stringify(payload.faq),
      payload.finalCtaTitle,
      payload.finalCtaText,
      payload.finalPrimaryLabel,
      payload.finalPrimaryHref,
      payload.finalSecondaryLabel,
      payload.finalSecondaryHref,
    ],
  )
  return getServicesPageContentRow()
}
