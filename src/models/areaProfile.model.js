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

function mapSchoolsSectionFromRow(row) {
  if (row == null || row.schools_json == null) return undefined
  const raw = row.schools_json
  const parsed =
    typeof raw === 'string' ? parseJsonSafe(raw, null) : typeof raw === 'object' ? raw : null
  if (!parsed || typeof parsed !== 'object') return undefined
  const items = Array.isArray(parsed.items) ? parsed.items : []
  if (!items.length) return undefined
  return {
    navLabel: typeof parsed.navLabel === 'string' ? parsed.navLabel : 'Escuelas',
    eyebrow: typeof parsed.eyebrow === 'string' ? parsed.eyebrow : '',
    title: typeof parsed.title === 'string' ? parsed.title : '',
    intro: typeof parsed.intro === 'string' ? parsed.intro : '',
    items,
  }
}

function mapAreaProfileRow(row) {
  if (!row) return null
  const schoolsSection = mapSchoolsSectionFromRow(row)
  const out = {
    slug: row.slug,
    heroTag: row.hero_tag || '',
    mission: row.mission || '',
    director: {
      name: row.director_name || '',
      role: row.director_role || '',
      bio: row.director_bio || '',
      photoUrl: row.director_photo_url || '',
      email: row.director_email || '',
      phone: row.director_phone || '',
      officeHours: row.director_office_hours || '',
    },
    serviceBlocks: parseJsonSafe(row.services_json, []),
    initiatives: parseJsonSafe(row.initiatives_json, []),
    contactCards: parseJsonSafe(row.contacts_json, []),
    notices: parseJsonSafe(row.notices_json, []),
    location: {
      address: row.location_address || '',
      references: row.location_references || '',
      mapEmbedUrl: row.location_map_embed_url || '',
      mapExternalUrl: row.location_map_external_url || '',
    },
    updatedAt: row.updated_at,
  }
  if (schoolsSection) {
    out.schoolsSection = schoolsSection
  }
  return out
}

export async function findAreaProfileBySlug(slug) {
  const [rows] = await pool.query(
    'SELECT * FROM area_profiles WHERE slug = ? LIMIT 1',
    [slug],
  )
  return mapAreaProfileRow(rows[0] ?? null)
}

export async function upsertAreaProfileBySlug(slug, payload) {
  await pool.query(
    `INSERT INTO area_profiles (
      slug,
      hero_tag,
      mission,
      director_name,
      director_role,
      director_bio,
      director_photo_url,
      director_email,
      director_phone,
      director_office_hours,
      services_json,
      initiatives_json,
      contacts_json,
      notices_json,
      schools_json,
      location_address,
      location_references,
      location_map_embed_url,
      location_map_external_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_tag = VALUES(hero_tag),
      mission = VALUES(mission),
      director_name = VALUES(director_name),
      director_role = VALUES(director_role),
      director_bio = VALUES(director_bio),
      director_photo_url = VALUES(director_photo_url),
      director_email = VALUES(director_email),
      director_phone = VALUES(director_phone),
      director_office_hours = VALUES(director_office_hours),
      services_json = VALUES(services_json),
      initiatives_json = VALUES(initiatives_json),
      contacts_json = VALUES(contacts_json),
      notices_json = VALUES(notices_json),
      schools_json = VALUES(schools_json),
      location_address = VALUES(location_address),
      location_references = VALUES(location_references),
      location_map_embed_url = VALUES(location_map_embed_url),
      location_map_external_url = VALUES(location_map_external_url),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      slug,
      payload.heroTag,
      payload.mission,
      payload.director.name,
      payload.director.role,
      payload.director.bio,
      payload.director.photoUrl,
      payload.director.email,
      payload.director.phone,
      payload.director.officeHours,
      JSON.stringify(payload.serviceBlocks),
      JSON.stringify(payload.initiatives),
      JSON.stringify(payload.contactCards),
      JSON.stringify(payload.notices),
      payload.schoolsSection ? JSON.stringify(payload.schoolsSection) : null,
      payload.location.address,
      payload.location.references,
      payload.location.mapEmbedUrl,
      payload.location.mapExternalUrl,
    ],
  )
  return findAreaProfileBySlug(slug)
}

export async function deleteAreaProfileBySlug(slug) {
  await pool.query('DELETE FROM area_profiles WHERE slug = ?', [slug])
}
