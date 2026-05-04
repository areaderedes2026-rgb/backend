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
      intro_title,
      intro_paragraphs_json,
      highlights_json,
      categories_json,
      offers_json,
      cta_title,
      cta_body
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
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
