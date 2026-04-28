import { pool } from '../config/db.js'

function mapIntendenciaRow(row) {
  if (!row) return null
  return {
    heroEyebrow: row.hero_eyebrow || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroImageUrl: row.hero_image_url || '',
    mayorName: row.mayor_name || '',
    mayorRole: row.mayor_role || '',
    mayorBio: row.mayor_bio || '',
    mayorPhotoUrl: row.mayor_photo_url || '',
    contactEmail: row.contact_email || '',
    contactPhone: row.contact_phone || '',
    officeHours: row.office_hours || '',
    updatedAt: row.updated_at || null,
  }
}

export async function getIntendenciaContentRow() {
  const [rows] = await pool.query(
    'SELECT * FROM intendencia_content WHERE id = 1 LIMIT 1',
  )
  return mapIntendenciaRow(rows[0] ?? null)
}

export async function upsertIntendenciaContentRow(payload) {
  await pool.query(
    `INSERT INTO intendencia_content (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_image_url,
      mayor_name,
      mayor_role,
      mayor_bio,
      mayor_photo_url,
      contact_email,
      contact_phone,
      office_hours
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_image_url = VALUES(hero_image_url),
      mayor_name = VALUES(mayor_name),
      mayor_role = VALUES(mayor_role),
      mayor_bio = VALUES(mayor_bio),
      mayor_photo_url = VALUES(mayor_photo_url),
      contact_email = VALUES(contact_email),
      contact_phone = VALUES(contact_phone),
      office_hours = VALUES(office_hours),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroEyebrow,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroImageUrl,
      payload.mayorName,
      payload.mayorRole,
      payload.mayorBio,
      payload.mayorPhotoUrl,
      payload.contactEmail,
      payload.contactPhone,
      payload.officeHours,
    ],
  )
  return getIntendenciaContentRow()
}
