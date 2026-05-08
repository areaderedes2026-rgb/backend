import { pool } from '../config/db.js'

function mapRow(row) {
  if (!row) return null
  return {
    pageKey: row.page_key || '',
    heroImageUrl: row.hero_image_url || '',
    updatedAt: row.updated_at || null,
  }
}

export async function getSitePageBannerRow(pageKey) {
  const [rows] = await pool.query(
    'SELECT page_key, hero_image_url, updated_at FROM site_page_banners WHERE page_key = ? LIMIT 1',
    [pageKey],
  )
  return mapRow(rows[0] ?? null)
}

export async function upsertSitePageBannerRow(pageKey, payload) {
  await pool.query(
    `INSERT INTO site_page_banners (page_key, hero_image_url)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       hero_image_url = VALUES(hero_image_url),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [pageKey, payload.heroImageUrl],
  )
  return getSitePageBannerRow(pageKey)
}
