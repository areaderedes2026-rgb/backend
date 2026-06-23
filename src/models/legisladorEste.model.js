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

function toBoolFlag(value, fallback = true) {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === '0' || v === 'false' || v === 'no') return false
    if (v === '1' || v === 'true' || v === 'yes') return true
  }
  return Boolean(value)
}

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
    showLegislatorPhoto: toBoolFlag(row.show_legislator_photo),
    showLegislatorRole: toBoolFlag(row.show_legislator_role),
    showLegislatorBio: toBoolFlag(row.show_legislator_bio),
    showContactPanel: toBoolFlag(row.show_contact_panel),
    showContactEmail: toBoolFlag(row.show_contact_email),
    showContactPhone: toBoolFlag(row.show_contact_phone),
    showOfficeHours: toBoolFlag(row.show_office_hours),
    showContactNote: toBoolFlag(row.show_contact_note),
    presentedProjects: parseJsonSafe(row.projects_json, null),
    commissions: parseJsonSafe(row.commissions_json, null),
    laws: parseJsonSafe(row.laws_json, null),
    showPresentedProjects: toBoolFlag(row.show_presented_projects, true),
    showCommissions: toBoolFlag(row.show_commissions, true),
    showLaws: toBoolFlag(row.show_laws, true),
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
      office_hours,
      show_legislator_photo,
      show_legislator_role,
      show_legislator_bio,
      show_contact_panel,
      show_contact_email,
      show_contact_phone,
      show_office_hours,
      show_contact_note,
      show_management_axes,
      projects_json,
      commissions_json,
      laws_json,
      show_presented_projects,
      show_commissions,
      show_laws
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)
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
      show_legislator_photo = VALUES(show_legislator_photo),
      show_legislator_role = VALUES(show_legislator_role),
      show_legislator_bio = VALUES(show_legislator_bio),
      show_contact_panel = VALUES(show_contact_panel),
      show_contact_email = VALUES(show_contact_email),
      show_contact_phone = VALUES(show_contact_phone),
      show_office_hours = VALUES(show_office_hours),
      show_contact_note = VALUES(show_contact_note),
      projects_json = VALUES(projects_json),
      commissions_json = VALUES(commissions_json),
      laws_json = VALUES(laws_json),
      show_presented_projects = VALUES(show_presented_projects),
      show_commissions = VALUES(show_commissions),
      show_laws = VALUES(show_laws),
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
      payload.showLegislatorPhoto ? 1 : 0,
      payload.showLegislatorRole ? 1 : 0,
      payload.showLegislatorBio ? 1 : 0,
      payload.showContactPanel ? 1 : 0,
      payload.showContactEmail ? 1 : 0,
      payload.showContactPhone ? 1 : 0,
      payload.showOfficeHours ? 1 : 0,
      payload.showContactNote ? 1 : 0,
      JSON.stringify(payload.presentedProjects || {}),
      JSON.stringify(payload.commissions || {}),
      JSON.stringify(payload.laws || {}),
      payload.showPresentedProjects ? 1 : 0,
      payload.showCommissions ? 1 : 0,
      payload.showLaws ? 1 : 0,
    ],
  )
  return getLegisladorEsteContentRow()
}
