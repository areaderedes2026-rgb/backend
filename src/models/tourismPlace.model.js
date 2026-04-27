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

function mapRow(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category || '',
    shortDescription: row.short_description || '',
    fullDescription: row.full_description || '',
    imageUrl: row.image_url || '',
    gallery: parseJsonSafe(row.gallery_json, []),
    address: row.address || '',
    howToGet: row.how_to_get || '',
    mapEmbedUrl: row.map_embed_url || '',
    mapExternalUrl: row.map_external_url || '',
    contactPhone: row.contact_phone || '',
    contactEmail: row.contact_email || '',
    contactWhatsapp: row.contact_whatsapp || '',
    visitingHours: row.visiting_hours || '',
    sortOrder: Number(row.sort_order) || 0,
    isActive: Boolean(row.is_active),
    updatedAt: row.updated_at,
  }
}

export async function listTourismPlaces({ onlyActive = false } = {}) {
  const where = onlyActive ? 'WHERE is_active = 1' : ''
  const [rows] = await pool.query(
    `SELECT * FROM tourism_places
     ${where}
     ORDER BY sort_order ASC, name ASC`,
  )
  return rows.map(mapRow)
}

export async function findTourismPlaceBySlug(slug, { includeInactive = false } = {}) {
  const [rows] = await pool.query(
    `SELECT * FROM tourism_places
     WHERE slug = ?
     ${includeInactive ? '' : 'AND is_active = 1'}
     LIMIT 1`,
    [slug],
  )
  return mapRow(rows[0] ?? null)
}

export async function findTourismPlaceById(id) {
  const [rows] = await pool.query('SELECT * FROM tourism_places WHERE id = ? LIMIT 1', [id])
  return mapRow(rows[0] ?? null)
}

export async function findTourismPlaceByName(name) {
  const [rows] = await pool.query(
    'SELECT * FROM tourism_places WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [name],
  )
  return mapRow(rows[0] ?? null)
}

export async function findTourismPlaceBySlugAny(slug) {
  const [rows] = await pool.query('SELECT * FROM tourism_places WHERE slug = ? LIMIT 1', [slug])
  return mapRow(rows[0] ?? null)
}

export async function createTourismPlaceRow(payload) {
  const [result] = await pool.query(
    `INSERT INTO tourism_places (
      slug,
      name,
      category,
      short_description,
      full_description,
      image_url,
      gallery_json,
      address,
      how_to_get,
      map_embed_url,
      map_external_url,
      contact_phone,
      contact_email,
      contact_whatsapp,
      visiting_hours,
      sort_order,
      is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.slug,
      payload.name,
      payload.category,
      payload.shortDescription,
      payload.fullDescription,
      payload.imageUrl,
      JSON.stringify(payload.gallery),
      payload.address,
      payload.howToGet,
      payload.mapEmbedUrl,
      payload.mapExternalUrl,
      payload.contactPhone,
      payload.contactEmail,
      payload.contactWhatsapp,
      payload.visitingHours,
      payload.sortOrder,
      payload.isActive ? 1 : 0,
    ],
  )
  return findTourismPlaceById(result.insertId)
}

export async function updateTourismPlaceRow(id, payload) {
  await pool.query(
    `UPDATE tourism_places
     SET slug = ?,
         name = ?,
         category = ?,
         short_description = ?,
         full_description = ?,
         image_url = ?,
         gallery_json = ?,
         address = ?,
         how_to_get = ?,
         map_embed_url = ?,
         map_external_url = ?,
         contact_phone = ?,
         contact_email = ?,
         contact_whatsapp = ?,
         visiting_hours = ?,
         sort_order = ?,
         is_active = ?
     WHERE id = ?`,
    [
      payload.slug,
      payload.name,
      payload.category,
      payload.shortDescription,
      payload.fullDescription,
      payload.imageUrl,
      JSON.stringify(payload.gallery),
      payload.address,
      payload.howToGet,
      payload.mapEmbedUrl,
      payload.mapExternalUrl,
      payload.contactPhone,
      payload.contactEmail,
      payload.contactWhatsapp,
      payload.visitingHours,
      payload.sortOrder,
      payload.isActive ? 1 : 0,
      id,
    ],
  )
  return findTourismPlaceById(id)
}

export async function deleteTourismPlaceRow(id) {
  const [result] = await pool.query('DELETE FROM tourism_places WHERE id = ? LIMIT 1', [id])
  return result.affectedRows > 0
}
