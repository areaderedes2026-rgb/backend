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
    channels: parseJsonSafe(row.channels_json, []),
    faq: parseJsonSafe(row.faq_json, []),
    tips: parseJsonSafe(row.tips_json, []),
    formTopics: parseJsonSafe(row.form_topics_json, []),
    formIntroText: row.form_intro_text || '',
    finalCtaTitle: row.final_cta_title || '',
    finalCtaText: row.final_cta_text || '',
    finalPrimaryLabel: row.final_primary_label || '',
    finalPrimaryHref: row.final_primary_href || '',
    finalSecondaryLabel: row.final_secondary_label || '',
    finalSecondaryHref: row.final_secondary_href || '',
    updatedAt: row.updated_at,
  }
}

function mapInquiryRow(row) {
  if (!row) return null
  return {
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    dni: row.dni || '',
    email: row.email || '',
    phone: row.phone || '',
    topic: row.topic || '',
    message: row.message || '',
    status: row.status || 'sin_resolver',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getCitizenAttentionContentRow() {
  const [rows] = await pool.query(
    'SELECT * FROM citizen_attention_content WHERE id = 1 LIMIT 1',
  )
  return mapContentRow(rows[0] ?? null)
}

export async function upsertCitizenAttentionContentRow(payload) {
  await pool.query(
    `INSERT INTO citizen_attention_content (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_image_url,
      channels_json,
      faq_json,
      tips_json,
      form_topics_json,
      form_intro_text,
      final_cta_title,
      final_cta_text,
      final_primary_label,
      final_primary_href,
      final_secondary_label,
      final_secondary_href
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
      channels_json = VALUES(channels_json),
      faq_json = VALUES(faq_json),
      tips_json = VALUES(tips_json),
      form_topics_json = VALUES(form_topics_json),
      form_intro_text = VALUES(form_intro_text),
      final_cta_title = VALUES(final_cta_title),
      final_cta_text = VALUES(final_cta_text),
      final_primary_label = VALUES(final_primary_label),
      final_primary_href = VALUES(final_primary_href),
      final_secondary_label = VALUES(final_secondary_label),
      final_secondary_href = VALUES(final_secondary_href),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroEyebrow,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroImageUrl,
      JSON.stringify(payload.channels),
      JSON.stringify(payload.faq),
      JSON.stringify(payload.tips),
      JSON.stringify(payload.formTopics),
      payload.formIntroText,
      payload.finalCtaTitle,
      payload.finalCtaText,
      payload.finalPrimaryLabel,
      payload.finalPrimaryHref,
      payload.finalSecondaryLabel,
      payload.finalSecondaryHref,
    ],
  )
  return getCitizenAttentionContentRow()
}

export async function createCitizenInquiryRow(payload) {
  const [result] = await pool.query(
    `INSERT INTO citizen_inquiries (
      first_name,
      last_name,
      dni,
      email,
      phone,
      topic,
      message,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.firstName,
      payload.lastName,
      payload.dni,
      payload.email,
      payload.phone,
      payload.topic,
      payload.message,
      payload.status,
    ],
  )
  return findCitizenInquiryByIdRow(result.insertId)
}

export async function findCitizenInquiryByIdRow(id) {
  const [rows] = await pool.query(
    'SELECT * FROM citizen_inquiries WHERE id = ? LIMIT 1',
    [id],
  )
  return mapInquiryRow(rows[0] ?? null)
}

export async function listCitizenInquiriesRows({ status = '', limit = 150 } = {}) {
  const n = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(Number(limit), 500)) : 150
  if (status) {
    const [rows] = await pool.query(
      `SELECT * FROM citizen_inquiries
       WHERE status = ?
       ORDER BY created_at DESC
       LIMIT ${n}`,
      [status],
    )
    return rows.map(mapInquiryRow)
  }
  const [rows] = await pool.query(
    `SELECT * FROM citizen_inquiries
     ORDER BY created_at DESC
     LIMIT ${n}`,
  )
  return rows.map(mapInquiryRow)
}

export async function updateCitizenInquiryStatusRow(id, status) {
  await pool.query(
    `UPDATE citizen_inquiries
     SET status = ?
     WHERE id = ?`,
    [status, id],
  )
  return findCitizenInquiryByIdRow(id)
}

export async function deleteCitizenInquiryRow(id) {
  const [result] = await pool.query(
    'DELETE FROM citizen_inquiries WHERE id = ? LIMIT 1',
    [id],
  )
  return result.affectedRows > 0
}
