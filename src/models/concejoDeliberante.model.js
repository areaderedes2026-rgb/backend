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

function mapConcejoDeliberanteRow(row) {
  if (!row) return null
  return {
    heroEyebrow: row.hero_eyebrow || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroImageUrl: row.hero_image_url || '',
    introTitle: row.intro_title || '',
    introParagraphs: parseJsonSafe(row.intro_paragraphs_json, []),
    presidentName: row.president_name || '',
    presidentRole: row.president_role || '',
    presidentBio: row.president_bio || '',
    presidentPhotoUrl: row.president_photo_url || '',
    sessionsTitle: row.sessions_title || '',
    sessionsSchedule: row.sessions_schedule || '',
    sessionsLocation: row.sessions_location || '',
    sessionsNote: row.sessions_note || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    contactAddress: row.contact_address || '',
    contactHours: row.contact_hours || '',
    blocks: parseJsonSafe(row.blocks_json, []),
    members: parseJsonSafe(row.members_json, []),
    commissions: parseJsonSafe(row.commissions_json, []),
    updatedAt: row.updated_at || null,
  }
}

export async function getConcejoDeliberanteContentRow() {
  const [rows] = await pool.query(
    'SELECT * FROM concejo_deliberante_content WHERE id = 1 LIMIT 1',
  )
  return mapConcejoDeliberanteRow(rows[0] ?? null)
}

export async function upsertConcejoDeliberanteContentRow(payload) {
  await pool.query(
    `INSERT INTO concejo_deliberante_content (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_image_url,
      intro_title,
      intro_paragraphs_json,
      president_name,
      president_role,
      president_bio,
      president_photo_url,
      sessions_title,
      sessions_schedule,
      sessions_location,
      sessions_note,
      contact_email,
      contact_phone,
      contact_address,
      contact_hours,
      blocks_json,
      members_json,
      commissions_json
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
      intro_title = VALUES(intro_title),
      intro_paragraphs_json = VALUES(intro_paragraphs_json),
      president_name = VALUES(president_name),
      president_role = VALUES(president_role),
      president_bio = VALUES(president_bio),
      president_photo_url = VALUES(president_photo_url),
      sessions_title = VALUES(sessions_title),
      sessions_schedule = VALUES(sessions_schedule),
      sessions_location = VALUES(sessions_location),
      sessions_note = VALUES(sessions_note),
      contact_email = VALUES(contact_email),
      contact_phone = VALUES(contact_phone),
      contact_address = VALUES(contact_address),
      contact_hours = VALUES(contact_hours),
      blocks_json = VALUES(blocks_json),
      members_json = VALUES(members_json),
      commissions_json = VALUES(commissions_json),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroEyebrow,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroImageUrl,
      payload.introTitle,
      JSON.stringify(payload.introParagraphs),
      payload.presidentName,
      payload.presidentRole,
      payload.presidentBio,
      payload.presidentPhotoUrl,
      payload.sessionsTitle,
      payload.sessionsSchedule,
      payload.sessionsLocation,
      payload.sessionsNote,
      payload.contactEmail,
      payload.contactPhone,
      payload.contactAddress,
      payload.contactHours,
      JSON.stringify(payload.blocks),
      JSON.stringify(payload.members),
      JSON.stringify(payload.commissions),
    ],
  )
  return getConcejoDeliberanteContentRow()
}
