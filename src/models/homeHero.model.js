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

function mapHomeHeroRow(row) {
  if (!row) return null
  return {
    displayMode: row.display_mode === 'carousel' ? 'carousel' : 'single',
    activeSlideId: row.active_slide_id || '',
    autoplayEnabled: row.autoplay_enabled !== 0,
    autoplaySeconds: Number(row.autoplay_seconds) || 6,
    slides: parseJsonSafe(row.slides_json, []),
    updatedAt: row.updated_at,
  }
}

export async function getHomeHeroContentRow() {
  const [rows] = await pool.query('SELECT * FROM home_hero_content WHERE id = 1 LIMIT 1')
  return mapHomeHeroRow(rows[0] ?? null)
}

export async function upsertHomeHeroContentRow(payload) {
  await pool.query(
    `INSERT INTO home_hero_content (
      id,
      display_mode,
      active_slide_id,
      autoplay_enabled,
      autoplay_seconds,
      slides_json
    ) VALUES (1, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      display_mode = VALUES(display_mode),
      active_slide_id = VALUES(active_slide_id),
      autoplay_enabled = VALUES(autoplay_enabled),
      autoplay_seconds = VALUES(autoplay_seconds),
      slides_json = VALUES(slides_json),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.displayMode,
      payload.activeSlideId,
      payload.autoplayEnabled ? 1 : 0,
      payload.autoplaySeconds,
      JSON.stringify(payload.slides),
    ],
  )
  return getHomeHeroContentRow()
}
