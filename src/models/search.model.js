import { pool } from '../config/db.js'

const FIVE_DAYS_SEC = 5 * 24 * 60 * 60

/**
 * @param {string} raw — texto ya normalizado (sin caracteres especiales de LIKE)
 */
export async function searchPublicDatabase(raw) {
  const like = `%${raw}%`
  const lim = 8

  const [newsRows] = await pool.query(
    `SELECT n.id, n.title, n.summary AS snippet, n.published_at
     FROM news n
     WHERE n.published_at <= NOW()
       AND (n.title LIKE ? OR n.summary LIKE ?)
     ORDER BY n.published_at DESC
     LIMIT ?`,
    [like, like, lim],
  )

  const [eventRows] = await pool.query(
    `SELECT e.id, e.title, e.summary AS snippet, e.place, e.event_date
     FROM events e
     WHERE e.is_active = 1
       AND (
         e.event_date >= NOW()
         OR TIMESTAMPDIFF(SECOND, e.event_date, NOW()) < ?
       )
       AND (e.title LIKE ? OR e.summary LIKE ? OR e.place LIKE ?)
     ORDER BY e.event_date ASC
     LIMIT ?`,
    [FIVE_DAYS_SEC, like, like, like, lim],
  )

  const [areaRows] = await pool.query(
    `SELECT a.slug, a.title, a.description AS snippet
     FROM areas a
     WHERE a.is_active = 1
       AND (a.title LIKE ? OR a.description LIKE ?)
     ORDER BY a.sort_order ASC, a.title ASC
     LIMIT ?`,
    [like, like, lim],
  )

  const [profileRows] = await pool.query(
    `SELECT a.slug, a.title, ap.hero_tag, ap.mission
     FROM area_profiles ap
     INNER JOIN areas a ON a.slug = ap.slug AND a.is_active = 1
     WHERE ap.hero_tag LIKE ? OR ap.mission LIKE ?
     ORDER BY a.sort_order ASC, a.title ASC
     LIMIT ?`,
    [like, like, lim],
  )

  const [tourismRows] = await pool.query(
    `SELECT t.slug, t.name, t.short_description AS snippet
     FROM tourism_places t
     WHERE t.is_active = 1
       AND (t.name LIKE ? OR t.short_description LIKE ? OR t.full_description LIKE ?)
     ORDER BY t.sort_order ASC, t.name ASC
     LIMIT ?`,
    [like, like, like, lim],
  )

  return { newsRows, eventRows, areaRows, profileRows, tourismRows }
}
