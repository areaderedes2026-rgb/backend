import { pool } from '../config/db.js'

function mapRow(row) {
  if (!row) return null
  const rawOpacity = Number(row.hero_overlay_opacity)
  const overlayOpacity = Number.isFinite(rawOpacity)
    ? Math.min(90, Math.max(0, Math.round(rawOpacity)))
    : 65
  return {
    heroImageUrl: row.hero_image_url || '',
    overlayOpacity,
    updatedAt: row.updated_at,
  }
}

export async function getAreasPageContentRow() {
  const [rows] = await pool.query(
    'SELECT hero_image_url, hero_overlay_opacity, updated_at FROM areas_page_content WHERE id = 1 LIMIT 1',
  )
  return mapRow(rows[0] ?? null)
}

export async function upsertAreasPageContentRow(payload) {
  await pool.query(
    `INSERT INTO areas_page_content (id, hero_image_url, hero_overlay_opacity)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE
       hero_image_url = VALUES(hero_image_url),
       hero_overlay_opacity = VALUES(hero_overlay_opacity),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [payload.heroImageUrl || '', Number(payload.overlayOpacity) || 65],
  )
  return getAreasPageContentRow()
}
