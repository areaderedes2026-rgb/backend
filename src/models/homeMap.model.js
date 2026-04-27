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

function mapHomeMapRow(row) {
  if (!row) return null
  return {
    center: {
      lat: Number(row.center_lat) || -26.2312,
      lng: Number(row.center_lng) || -65.2818,
    },
    zoom: Number(row.zoom_level) || 14,
    points: parseJsonSafe(row.points_json, []),
    updatedAt: row.updated_at,
  }
}

export async function getHomeMapContentRow() {
  const [rows] = await pool.query('SELECT * FROM home_map_content WHERE id = 1 LIMIT 1')
  return mapHomeMapRow(rows[0] ?? null)
}

export async function upsertHomeMapContentRow(payload) {
  await pool.query(
    `INSERT INTO home_map_content (
      id,
      center_lat,
      center_lng,
      zoom_level,
      points_json
    ) VALUES (1, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      center_lat = VALUES(center_lat),
      center_lng = VALUES(center_lng),
      zoom_level = VALUES(zoom_level),
      points_json = VALUES(points_json),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.center.lat,
      payload.center.lng,
      payload.zoom,
      JSON.stringify(payload.points),
    ],
  )
  return getHomeMapContentRow()
}
