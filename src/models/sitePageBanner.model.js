import { pool } from '../config/db.js'

function mapRow(row) {
  if (!row) return null
  const rawOpacity = Number(row.hero_overlay_opacity)
  const overlayOpacity = Number.isFinite(rawOpacity)
    ? Math.min(90, Math.max(0, Math.round(rawOpacity)))
    : 65
  return {
    pageKey: row.page_key || '',
    heroImageUrl: row.hero_image_url || '',
    overlayOpacity,
    updatedAt: row.updated_at || null,
  }
}

export async function getSitePageBannerRow(pageKey) {
  const [rows] = await pool.query(
    'SELECT page_key, hero_image_url, hero_overlay_opacity, updated_at FROM site_page_banners WHERE page_key = ? LIMIT 1',
    [pageKey],
  )
  return mapRow(rows[0] ?? null)
}

export async function upsertSitePageBannerRow(pageKey, payload) {
  await pool.query(
    `INSERT INTO site_page_banners (page_key, hero_image_url, hero_overlay_opacity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       hero_image_url = VALUES(hero_image_url),
       hero_overlay_opacity = VALUES(hero_overlay_opacity),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [pageKey, payload.heroImageUrl, Number(payload.overlayOpacity) || 65],
  )
  return getSitePageBannerRow(pageKey)
}
