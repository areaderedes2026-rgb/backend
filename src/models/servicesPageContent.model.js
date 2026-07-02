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
    heroSearchPlaceholder: row.hero_search_placeholder || '¿Qué trámite estás buscando?',
    heroImageUrl: row.hero_image_url || '',
    overlayOpacity: Number.isFinite(Number(row.hero_overlay_opacity))
      ? Math.min(90, Math.max(0, Math.round(Number(row.hero_overlay_opacity))))
      : 65,
    heroPrimaryLabel: row.hero_primary_label || '',
    heroPrimaryHref: row.hero_primary_href || '',
    heroSecondaryLabel: row.hero_secondary_label || '',
    heroSecondaryHref: row.hero_secondary_href || '',
    showHeroBadge: row.show_hero_badge !== 0,
    showHeroTitle: row.show_hero_title !== 0,
    showHeroSubtitle: row.show_hero_subtitle !== 0,
    showSearch: row.show_search !== 0,
    showPrimaryButton: row.show_primary_button !== 0,
    showSecondaryButton: row.show_secondary_button !== 0,
    steps: parseJsonSafe(row.steps_json, []),
    scheduleLines: parseJsonSafe(row.schedule_lines_json, []),
    categories: parseJsonSafe(row.categories_json, []),
    proceduresEyebrow: row.procedures_eyebrow || '',
    proceduresTitle: row.procedures_title || '',
    faq: parseJsonSafe(row.faq_json, []),
    sectionVisibility: parseJsonSafe(row.section_visibility_json, {
      processGuide: true,
      categories: true,
      faq: true,
      finalCta: true,
    }),
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
      hero_search_placeholder,
      hero_image_url,
      hero_overlay_opacity,
      hero_primary_label,
      hero_primary_href,
      hero_secondary_label,
      hero_secondary_href,
      show_hero_badge,
      show_hero_title,
      show_hero_subtitle,
      show_search,
      show_primary_button,
      show_secondary_button,
      steps_json,
      schedule_lines_json,
      categories_json,
      procedures_eyebrow,
      procedures_title,
      faq_json,
      section_visibility_json,
      final_cta_title,
      final_cta_text,
      final_primary_label,
      final_primary_href,
      final_secondary_label,
      final_secondary_href
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_search_placeholder = VALUES(hero_search_placeholder),
      hero_image_url = VALUES(hero_image_url),
      hero_overlay_opacity = VALUES(hero_overlay_opacity),
      hero_primary_label = VALUES(hero_primary_label),
      hero_primary_href = VALUES(hero_primary_href),
      hero_secondary_label = VALUES(hero_secondary_label),
      hero_secondary_href = VALUES(hero_secondary_href),
      show_hero_badge = VALUES(show_hero_badge),
      show_hero_title = VALUES(show_hero_title),
      show_hero_subtitle = VALUES(show_hero_subtitle),
      show_search = VALUES(show_search),
      show_primary_button = VALUES(show_primary_button),
      show_secondary_button = VALUES(show_secondary_button),
      steps_json = VALUES(steps_json),
      schedule_lines_json = VALUES(schedule_lines_json),
      categories_json = VALUES(categories_json),
      procedures_eyebrow = VALUES(procedures_eyebrow),
      procedures_title = VALUES(procedures_title),
      faq_json = VALUES(faq_json),
      section_visibility_json = VALUES(section_visibility_json),
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
      payload.heroSearchPlaceholder,
      payload.heroImageUrl,
      Number(payload.overlayOpacity) || 65,
      payload.heroPrimaryLabel,
      payload.heroPrimaryHref,
      payload.heroSecondaryLabel,
      payload.heroSecondaryHref,
      payload.showHeroBadge ? 1 : 0,
      payload.showHeroTitle ? 1 : 0,
      payload.showHeroSubtitle ? 1 : 0,
      payload.showSearch ? 1 : 0,
      payload.showPrimaryButton ? 1 : 0,
      payload.showSecondaryButton ? 1 : 0,
      JSON.stringify(payload.steps),
      JSON.stringify(payload.scheduleLines),
      JSON.stringify(payload.categories),
      payload.proceduresEyebrow,
      payload.proceduresTitle,
      JSON.stringify(payload.faq),
      JSON.stringify(payload.sectionVisibility || {}),
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
