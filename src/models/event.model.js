import { pool } from '../config/db.js'

function mapEventRow(row) {
  if (!row) return null
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    eventDate: row.event_date,
    place: row.place,
    summary: row.summary,
    flyerUrl: row.flyer_url,
    isActive: Boolean(row.is_active),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listEventsRows({ onlyActive = false } = {}) {
  const where = onlyActive ? 'WHERE e.is_active = 1' : ''
  const [rows] = await pool.query(
    `SELECT
      e.id, e.slug, e.title, e.event_date, e.place, e.summary, e.flyer_url,
      e.is_active, e.sort_order, e.created_at, e.updated_at
     FROM events e
     ${where}
     ORDER BY e.event_date ASC, e.sort_order ASC, e.id ASC`,
  )
  return rows.map(mapEventRow)
}

export async function findEventByIdRow(id) {
  const [rows] = await pool.query(
    `SELECT
      e.id, e.slug, e.title, e.event_date, e.place, e.summary, e.flyer_url,
      e.is_active, e.sort_order, e.created_at, e.updated_at
     FROM events e
     WHERE e.id = ?
     LIMIT 1`,
    [id],
  )
  return mapEventRow(rows[0] ?? null)
}

export async function findEventBySlugRow(slug) {
  const [rows] = await pool.query(
    `SELECT id FROM events WHERE slug = ? LIMIT 1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function createEventRow(payload) {
  const [result] = await pool.query(
    `INSERT INTO events (slug, title, event_date, place, summary, flyer_url, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.slug,
      payload.title,
      payload.eventDate,
      payload.place,
      payload.summary,
      payload.flyerUrl,
      payload.isActive ? 1 : 0,
      payload.sortOrder,
    ],
  )
  return findEventByIdRow(result.insertId)
}

export async function updateEventRow(id, payload) {
  await pool.query(
    `UPDATE events
     SET slug = ?, title = ?, event_date = ?, place = ?, summary = ?, flyer_url = ?,
         is_active = ?, sort_order = ?
     WHERE id = ?`,
    [
      payload.slug,
      payload.title,
      payload.eventDate,
      payload.place,
      payload.summary,
      payload.flyerUrl,
      payload.isActive ? 1 : 0,
      payload.sortOrder,
      id,
    ],
  )
  return findEventByIdRow(id)
}

export async function deleteEventRow(id) {
  const [result] = await pool.query('DELETE FROM events WHERE id = ?', [id])
  return result.affectedRows > 0
}
