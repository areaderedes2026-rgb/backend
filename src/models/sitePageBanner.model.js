import { pool } from '../config/db.js'
import { mapPageHeroCoverRow } from '../utils/pageHeroCover.js'

const HERO_COLUMNS = `
  page_key,
  hero_image_url,
  hero_overlay_opacity,
  hero_badge,
  hero_title,
  hero_subtitle,
  hero_search_placeholder,
  show_hero_badge,
  show_hero_title,
  show_hero_subtitle,
  show_search,
  show_primary_button,
  primary_label,
  primary_href,
  show_secondary_button,
  secondary_label,
  secondary_href,
  updated_at
`

function mapRow(row) {
  return mapPageHeroCoverRow(row, { pageKey: row?.page_key || '' })
}

export async function getSitePageBannerRow(pageKey) {
  const [rows] = await pool.query(
    `SELECT ${HERO_COLUMNS} FROM site_page_banners WHERE page_key = ? LIMIT 1`,
    [pageKey],
  )
  return mapRow(rows[0] ?? null)
}

export async function upsertSitePageBannerRow(pageKey, payload) {
  await pool.query(
    `INSERT INTO site_page_banners (
      page_key,
      hero_image_url,
      hero_overlay_opacity,
      hero_badge,
      hero_title,
      hero_subtitle,
      hero_search_placeholder,
      show_hero_badge,
      show_hero_title,
      show_hero_subtitle,
      show_search,
      show_primary_button,
      primary_label,
      primary_href,
      show_secondary_button,
      secondary_label,
      secondary_href
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       hero_image_url = VALUES(hero_image_url),
       hero_overlay_opacity = VALUES(hero_overlay_opacity),
       hero_badge = VALUES(hero_badge),
       hero_title = VALUES(hero_title),
       hero_subtitle = VALUES(hero_subtitle),
       hero_search_placeholder = VALUES(hero_search_placeholder),
       show_hero_badge = VALUES(show_hero_badge),
       show_hero_title = VALUES(show_hero_title),
       show_hero_subtitle = VALUES(show_hero_subtitle),
       show_search = VALUES(show_search),
       show_primary_button = VALUES(show_primary_button),
       primary_label = VALUES(primary_label),
       primary_href = VALUES(primary_href),
       show_secondary_button = VALUES(show_secondary_button),
       secondary_label = VALUES(secondary_label),
       secondary_href = VALUES(secondary_href),
       updated_at = CURRENT_TIMESTAMP(3)`,
    [
      pageKey,
      payload.heroImageUrl || '',
      Math.min(
        90,
        Math.max(
          0,
          Math.round(
            Number.isFinite(Number(payload.overlayOpacity))
              ? Number(payload.overlayOpacity)
              : 65,
          ),
        ),
      ),
      payload.heroBadge || '',
      payload.heroTitle || '',
      payload.heroSubtitle || '',
      payload.heroSearchPlaceholder || '',
      payload.showHeroBadge !== false ? 1 : 0,
      payload.showHeroTitle !== false ? 1 : 0,
      payload.showHeroSubtitle !== false ? 1 : 0,
      payload.showSearch !== false ? 1 : 0,
      payload.showPrimaryButton === true ? 1 : 0,
      payload.primaryLabel || '',
      payload.primaryHref || '',
      payload.showSecondaryButton === true ? 1 : 0,
      payload.secondaryLabel || '',
      payload.secondaryHref || '',
    ],
  )
  return getSitePageBannerRow(pageKey)
}
