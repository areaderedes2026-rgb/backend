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

function mapHomeEmergencyRow(row) {
  if (!row) return null
  return {
    eyebrow: row.eyebrow || '',
    title: row.title || '',
    subtitle: row.subtitle || '',
    imageUrl: row.image_url || '',
    overlayOpacity: Number.isFinite(Number(row.overlay_opacity))
      ? Math.min(90, Math.max(0, Math.round(Number(row.overlay_opacity))))
      : 65,
    showEyebrow: row.show_eyebrow !== 0,
    showTitle: row.show_title !== 0,
    showSubtitle: row.show_subtitle !== 0,
    numbers: parseJsonSafe(row.numbers_json, []),
    updatedAt: row.updated_at,
  }
}

export async function getHomeEmergencyContentRow() {
  const [rows] = await pool.query('SELECT * FROM home_emergency_content WHERE id = 1 LIMIT 1')
  return mapHomeEmergencyRow(rows[0] ?? null)
}

export async function upsertHomeEmergencyContentRow(payload) {
  await pool.query(
    `INSERT INTO home_emergency_content (
      id,
      eyebrow,
      title,
      subtitle,
      image_url,
      overlay_opacity,
      show_eyebrow,
      show_title,
      show_subtitle,
      numbers_json
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      eyebrow = VALUES(eyebrow),
      title = VALUES(title),
      subtitle = VALUES(subtitle),
      image_url = VALUES(image_url),
      overlay_opacity = VALUES(overlay_opacity),
      show_eyebrow = VALUES(show_eyebrow),
      show_title = VALUES(show_title),
      show_subtitle = VALUES(show_subtitle),
      numbers_json = VALUES(numbers_json),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.eyebrow,
      payload.title,
      payload.subtitle,
      payload.imageUrl,
      payload.overlayOpacity,
      payload.showEyebrow ? 1 : 0,
      payload.showTitle ? 1 : 0,
      payload.showSubtitle ? 1 : 0,
      JSON.stringify(payload.numbers),
    ],
  )
  return getHomeEmergencyContentRow()
}
