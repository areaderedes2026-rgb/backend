import { pool } from '../config/db.js'

function mapRow(row) {
  if (!row) return null
  return {
    heroImageUrl: row.hero_image_url || '',
    updatedAt: row.updated_at,
  }
}

export async function getAreasPageContentRow() {
  const [rows] = await pool.query(
    'SELECT hero_image_url, updated_at FROM areas_page_content WHERE id = 1 LIMIT 1',
  )
  return mapRow(rows[0] ?? null)
}

export async function upsertAreasPageContentRow(payload) {
  await pool.query(
    `INSERT INTO areas_page_content (id, hero_image_url)
     VALUES (1, ?)
     ON DUPLICATE KEY UPDATE
       hero_image_url = VALUES(hero_image_url),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [payload.heroImageUrl || ''],
  )
  return getAreasPageContentRow()
}
