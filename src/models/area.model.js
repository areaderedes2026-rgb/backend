import { pool } from '../config/db.js'

export async function listAreas({ includeInactive = false } = {}) {
  const sql = includeInactive
    ? `SELECT id, slug, title, description, cover_image_url, sort_order, is_active, created_at, updated_at
       FROM areas
       ORDER BY sort_order ASC, title ASC`
    : `SELECT id, slug, title, description, cover_image_url, sort_order, is_active, created_at, updated_at
       FROM areas
       WHERE is_active = 1
       ORDER BY sort_order ASC, title ASC`
  const [rows] = await pool.query(sql)
  return rows
}

export async function findAreaBySlug(slug, { includeInactive = false } = {}) {
  const sql = includeInactive
    ? 'SELECT * FROM areas WHERE slug = ? LIMIT 1'
    : 'SELECT * FROM areas WHERE slug = ? AND is_active = 1 LIMIT 1'
  const [rows] = await pool.query(sql, [slug])
  return rows[0] ?? null
}

export async function findAreaById(id) {
  const [rows] = await pool.query('SELECT * FROM areas WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

export async function findAreaByTitle(title) {
  const t = String(title || '').trim()
  if (!t) return null
  const [rows] = await pool.query('SELECT * FROM areas WHERE title = ? LIMIT 1', [t])
  return rows[0] ?? null
}

export async function createAreaRow({
  slug,
  title,
  description,
  coverImageUrl = '',
  sortOrder = 0,
  isActive = 1,
}) {
  const [result] = await pool.query(
    `INSERT INTO areas (slug, title, description, cover_image_url, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [slug, title, description, coverImageUrl, sortOrder, isActive ? 1 : 0],
  )
  return findAreaById(result.insertId)
}

export async function updateAreaRow(id, data) {
  const fields = []
  const values = []
  if (data.slug !== undefined) {
    fields.push('slug = ?')
    values.push(data.slug)
  }
  if (data.title !== undefined) {
    fields.push('title = ?')
    values.push(data.title)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.coverImageUrl !== undefined) {
    fields.push('cover_image_url = ?')
    values.push(data.coverImageUrl)
  }
  if (data.sortOrder !== undefined) {
    fields.push('sort_order = ?')
    values.push(data.sortOrder)
  }
  if (data.isActive !== undefined) {
    fields.push('is_active = ?')
    values.push(data.isActive ? 1 : 0)
  }
  if (fields.length === 0) return findAreaById(id)
  values.push(id)
  await pool.query(`UPDATE areas SET ${fields.join(', ')} WHERE id = ?`, values)
  return findAreaById(id)
}

export async function deleteAreaRow(id) {
  const [result] = await pool.query('DELETE FROM areas WHERE id = ?', [id])
  return result.affectedRows > 0
}
