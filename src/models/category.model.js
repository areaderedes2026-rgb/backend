import { pool } from '../config/db.js'

export async function listCategories() {
  const [rows] = await pool.query(
    `SELECT id, name, slug, sort_order, created_at, updated_at
     FROM categories
     ORDER BY sort_order ASC, name ASC`,
  )
  return rows
}

export async function findCategoryById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

export async function findCategoryBySlug(slug) {
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE slug = ? LIMIT 1',
    [slug],
  )
  return rows[0] ?? null
}

export async function findCategoryByName(name) {
  const n = String(name || '').trim()
  if (!n) return null
  const [rows] = await pool.query(
    'SELECT * FROM categories WHERE name = ? LIMIT 1',
    [n],
  )
  return rows[0] ?? null
}

export async function createCategoryRow({ name, slug, sortOrder = 0 }) {
  const [result] = await pool.query(
    `INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?)`,
    [name, slug, sortOrder],
  )
  return findCategoryById(result.insertId)
}

export async function updateCategoryRow(id, data) {
  const fields = []
  const values = []
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.slug !== undefined) {
    fields.push('slug = ?')
    values.push(data.slug)
  }
  if (data.sortOrder !== undefined) {
    fields.push('sort_order = ?')
    values.push(data.sortOrder)
  }
  if (fields.length === 0) return findCategoryById(id)
  values.push(id)
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values)
  return findCategoryById(id)
}

export async function deleteCategoryRow(id) {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id])
  return result.affectedRows > 0
}

export async function countNewsByCategoryId(categoryId) {
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM news WHERE category_id = ?',
    [categoryId],
  )
  return Number(total)
}
