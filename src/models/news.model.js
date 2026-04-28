import { pool } from '../config/db.js'

const SELECT_JOIN = `n.id, n.slug, n.title, n.summary, n.body, n.published_at, n.category_id,
  n.image_url, n.created_by, n.updated_by, n.created_at, n.updated_at,
  c.name AS category_name, c.slug AS category_slug,
  creator.username AS creator_username, creator.full_name AS creator_full_name,
  editor.username AS editor_username, editor.full_name AS editor_full_name,
  COALESCE(ns.views_count, 0) AS views_count,
  COALESCE(ns.share_facebook_count, 0) AS share_facebook_count,
  COALESCE(ns.share_whatsapp_count, 0) AS share_whatsapp_count,
  COALESCE(ns.share_instagram_count, 0) AS share_instagram_count,
  COALESCE(ns.share_native_count, 0) AS share_native_count,
  COALESCE(ns.share_copy_link_count, 0) AS share_copy_link_count,
  ns.last_viewed_at, ns.last_shared_at`

export async function findAllNews() {
  const [rows] = await pool.query(
    `SELECT ${SELECT_JOIN}
     FROM news n
     LEFT JOIN categories c ON c.id = n.category_id
     LEFT JOIN users creator ON creator.id = n.created_by
     LEFT JOIN users editor ON editor.id = n.updated_by
     LEFT JOIN news_stats ns ON ns.news_id = n.id
     ORDER BY n.published_at DESC, n.id DESC`,
  )
  return rows
}

export async function findNewsByIdOrSlug(idOrSlug) {
  const raw = String(idOrSlug).trim()
  if (/^\d+$/.test(raw)) {
    const [rows] = await pool.query(
      `SELECT ${SELECT_JOIN}
       FROM news n
       LEFT JOIN categories c ON c.id = n.category_id
       LEFT JOIN users creator ON creator.id = n.created_by
       LEFT JOIN users editor ON editor.id = n.updated_by
       LEFT JOIN news_stats ns ON ns.news_id = n.id
       WHERE n.id = ?
       LIMIT 1`,
      [Number(raw)],
    )
    return rows[0] ?? null
  }
  const [rows] = await pool.query(
    `SELECT ${SELECT_JOIN}
     FROM news n
     LEFT JOIN categories c ON c.id = n.category_id
     LEFT JOIN users creator ON creator.id = n.created_by
     LEFT JOIN users editor ON editor.id = n.updated_by
     LEFT JOIN news_stats ns ON ns.news_id = n.id
     WHERE n.slug = ?
     LIMIT 1`,
    [raw],
  )
  return rows[0] ?? null
}

export async function findNewsById(id) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_JOIN}
     FROM news n
     LEFT JOIN categories c ON c.id = n.category_id
     LEFT JOIN users creator ON creator.id = n.created_by
     LEFT JOIN users editor ON editor.id = n.updated_by
     LEFT JOIN news_stats ns ON ns.news_id = n.id
     WHERE n.id = ?
     LIMIT 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function findNewsBySlug(slug) {
  const [rows] = await pool.query(
    `SELECT ${SELECT_JOIN}
     FROM news n
     LEFT JOIN categories c ON c.id = n.category_id
     LEFT JOIN users creator ON creator.id = n.created_by
     LEFT JOIN users editor ON editor.id = n.updated_by
     LEFT JOIN news_stats ns ON ns.news_id = n.id
     WHERE n.slug = ?
     LIMIT 1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function createNews({
  slug,
  title,
  summary,
  body,
  publishedAt,
  categoryId,
  imageUrl,
  createdBy,
}) {
  const [result] = await pool.query(
    `INSERT INTO news (slug, title, summary, body, published_at, category_id, image_url, created_by, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slug,
      title,
      summary,
      body,
      publishedAt,
      categoryId ?? null,
      imageUrl ?? null,
      createdBy ?? null,
      createdBy ?? null,
    ],
  )
  return findNewsById(result.insertId)
}

export async function ensureNewsStats(newsId) {
  await pool.query(
    `INSERT INTO news_stats (news_id)
     VALUES (?)
     ON DUPLICATE KEY UPDATE news_id = news_id`,
    [newsId],
  )
}

export async function recordNewsView(newsId) {
  await ensureNewsStats(newsId)
  await pool.query(
    `UPDATE news_stats
     SET views_count = views_count + 1,
         last_viewed_at = CURRENT_TIMESTAMP(3)
     WHERE news_id = ?`,
    [newsId],
  )
}

export async function recordNewsShare(newsId, channel) {
  const channelMap = {
    facebook: 'share_facebook_count',
    whatsapp: 'share_whatsapp_count',
    instagram: 'share_instagram_count',
    native: 'share_native_count',
    copy_link: 'share_copy_link_count',
  }
  const col = channelMap[channel]
  if (!col) return
  await ensureNewsStats(newsId)
  await pool.query(
    `UPDATE news_stats
     SET ${col} = ${col} + 1,
         last_shared_at = CURRENT_TIMESTAMP(3)
     WHERE news_id = ?`,
    [newsId],
  )
}

export async function getNewsStatsOverview() {
  const [[totals]] = await pool.query(
    `SELECT
      COUNT(*) AS total_news,
      COALESCE(SUM(ns.views_count), 0) AS total_views,
      COALESCE(SUM(ns.share_facebook_count + ns.share_whatsapp_count + ns.share_instagram_count + ns.share_native_count + ns.share_copy_link_count), 0) AS total_shares,
      COALESCE(SUM(ns.share_facebook_count), 0) AS total_facebook,
      COALESCE(SUM(ns.share_whatsapp_count), 0) AS total_whatsapp,
      COALESCE(SUM(ns.share_instagram_count), 0) AS total_instagram,
      COALESCE(SUM(ns.share_native_count), 0) AS total_native,
      COALESCE(SUM(ns.share_copy_link_count), 0) AS total_copy_link
     FROM news n
     LEFT JOIN news_stats ns ON ns.news_id = n.id`,
  )

  const [topViews] = await pool.query(
    `SELECT n.id, n.title, n.slug, COALESCE(ns.views_count, 0) AS views_count
     FROM news n
     LEFT JOIN news_stats ns ON ns.news_id = n.id
     ORDER BY views_count DESC, n.id DESC
     LIMIT 5`,
  )

  const [topShares] = await pool.query(
    `SELECT
      n.id,
      n.title,
      n.slug,
      COALESCE(ns.share_facebook_count + ns.share_whatsapp_count + ns.share_instagram_count + ns.share_native_count + ns.share_copy_link_count, 0) AS shares_count
     FROM news n
     LEFT JOIN news_stats ns ON ns.news_id = n.id
     ORDER BY shares_count DESC, n.id DESC
     LIMIT 5`,
  )

  return {
    totals,
    topViews,
    topShares,
  }
}

export async function updateNews(id, data, updatedBy = null) {
  const fields = []
  const values = []

  const map = {
    slug: 'slug',
    title: 'title',
    summary: 'summary',
    body: 'body',
    publishedAt: 'published_at',
    categoryId: 'category_id',
    imageUrl: 'image_url',
  }

  for (const [key, col] of Object.entries(map)) {
    if (data[key] !== undefined) {
      fields.push(`${col} = ?`)
      values.push(data[key])
    }
  }

  if (fields.length === 0) return findNewsById(id)

  fields.push('updated_by = ?')
  values.push(updatedBy)
  values.push(id)
  await pool.query(
    `UPDATE news SET ${fields.join(', ')} WHERE id = ?`,
    values,
  )
  return findNewsById(id)
}

export async function deleteNews(id) {
  const [result] = await pool.query('DELETE FROM news WHERE id = ?', [id])
  return result.affectedRows > 0
}

export async function findGalleryUrlsByNewsId(newsId) {
  const [rows] = await pool.query(
    `SELECT image_url FROM news_images WHERE news_id = ? ORDER BY sort_order ASC, id ASC`,
    [newsId],
  )
  return rows.map((r) => r.image_url)
}

export async function deleteGalleryByNewsId(newsId) {
  await pool.query('DELETE FROM news_images WHERE news_id = ?', [newsId])
}

export async function insertGalleryImages(newsId, urls) {
  if (!urls?.length) return
  const list = urls.filter((u) => typeof u === 'string' && u.trim())
  for (let i = 0; i < list.length; i += 1) {
    await pool.query(
      `INSERT INTO news_images (news_id, image_url, sort_order) VALUES (?, ?, ?)`,
      [newsId, list[i].trim(), i],
    )
  }
}

export async function slugExists(slug, excludeId = null) {
  if (excludeId == null) {
    const [rows] = await pool.query(
      'SELECT id FROM news WHERE slug = ? LIMIT 1',
      [slug],
    )
    return rows.length > 0
  }
  const [rows] = await pool.query(
    'SELECT id FROM news WHERE slug = ? AND id != ? LIMIT 1',
    [slug, excludeId],
  )
  return rows.length > 0
}
