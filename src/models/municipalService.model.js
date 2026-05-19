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
    title: row.title,
    category: row.category || '',
    mode: row.mode || '',
    eta: row.eta || '',
    summary: row.summary || '',
    docs: parseJsonSafe(row.docs_json, []),
    linkHref: row.link_href || '',
    sortOrder: Number(row.sort_order) || 0,
    isActive: Boolean(row.is_active),
    updatedAt: row.updated_at,
  }
}

export async function listMunicipalServices({ onlyActive = false } = {}) {
  const where = onlyActive ? 'WHERE is_active = 1' : ''
  const [rows] = await pool.query(
    `SELECT * FROM municipal_services
     ${where}
     ORDER BY sort_order ASC, title ASC`,
  )
  return rows.map(mapRow)
}

export async function findMunicipalServiceById(id) {
  const [rows] = await pool.query('SELECT * FROM municipal_services WHERE id = ? LIMIT 1', [id])
  return mapRow(rows[0] ?? null)
}

export async function findMunicipalServiceBySlugAny(slug) {
  const [rows] = await pool.query('SELECT * FROM municipal_services WHERE slug = ? LIMIT 1', [slug])
  return mapRow(rows[0] ?? null)
}

export async function createMunicipalServiceRow(payload) {
  const [result] = await pool.query(
    `INSERT INTO municipal_services (
      slug, title, category, mode, eta, summary, docs_json, link_href, sort_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.slug,
      payload.title,
      payload.category,
      payload.mode,
      payload.eta,
      payload.summary,
      JSON.stringify(payload.docs),
      payload.linkHref,
      payload.sortOrder,
      payload.isActive ? 1 : 0,
    ],
  )
  return findMunicipalServiceById(result.insertId)
}

export async function updateMunicipalServiceRow(id, payload) {
  await pool.query(
    `UPDATE municipal_services
     SET slug = ?,
         title = ?,
         category = ?,
         mode = ?,
         eta = ?,
         summary = ?,
         docs_json = ?,
         link_href = ?,
         sort_order = ?,
         is_active = ?
     WHERE id = ?`,
    [
      payload.slug,
      payload.title,
      payload.category,
      payload.mode,
      payload.eta,
      payload.summary,
      JSON.stringify(payload.docs),
      payload.linkHref,
      payload.sortOrder,
      payload.isActive ? 1 : 0,
      id,
    ],
  )
  return findMunicipalServiceById(id)
}

export async function deleteMunicipalServiceRow(id) {
  const [result] = await pool.query('DELETE FROM municipal_services WHERE id = ? LIMIT 1', [id])
  return result.affectedRows > 0
}
