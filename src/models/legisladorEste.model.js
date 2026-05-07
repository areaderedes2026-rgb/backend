import { pool } from '../config/db.js'

function mapLegisladorEsteRow(row) {
  if (!row) return null
  return {
    heroEyebrow: row.hero_eyebrow || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroImageUrl: row.hero_image_url || '',
    legislatorName: row.legislator_name || '',
    legislatorRole: row.legislator_role || '',
    legislatorBio: row.legislator_bio || '',
    legislatorPhotoUrl: row.legislator_photo_url || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    officeHours: row.office_hours || '',
    updatedAt: row.updated_at || null,
  }
}

export async function getLegisladorEsteContentRow() {
  const [rows] = await pool.query(
    'SELECT * FROM legislador_este_content WHERE id = 1 LIMIT 1',
  )
  return mapLegisladorEsteRow(rows[0] ?? null)
}

export async function upsertLegisladorEsteContentRow(payload) {
  await pool.query(
    `INSERT INTO legislador_este_content (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_image_url,
      legislator_name,
      legislator_role,
      legislator_bio,
      legislator_photo_url,
      contact_email,
      contact_phone,
      office_hours
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
      legislator_name = VALUES(legislator_name),
      legislator_role = VALUES(legislator_role),
      legislator_bio = VALUES(legislator_bio),
      legislator_photo_url = VALUES(legislator_photo_url),
      contact_email = VALUES(contact_email),
      contact_phone = VALUES(contact_phone),
      office_hours = VALUES(office_hours),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroEyebrow,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroImageUrl,
      payload.legislatorName,
      payload.legislatorRole,
      payload.legislatorBio,
      payload.legislatorPhotoUrl,
      payload.contactEmail,
      payload.contactPhone,
      payload.officeHours,
    ],
  )
  return getLegisladorEsteContentRow()
}
