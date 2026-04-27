import { pool } from '../config/db.js'

const SELECT_JOIN = `n.id, n.slug, n.title, n.summary, n.body, n.published_at, n.category_id,
  n.image_url, n.created_by, n.created_at, n.updated_at,
  c.name AS category_name, c.slug AS category_slug`

export async function findAllNews() {
  const [rows] = await pool.query(
    `SELECT ${SELECT_JOIN}
     FROM news n
     LEFT JOIN categories c ON c.id = n.category_id
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
    `INSERT INTO news (slug, title, summary, body, published_at, category_id, image_url, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      slug,
      title,
      summary,
      body,
      publishedAt,
      categoryId ?? null,
      imageUrl ?? null,
      createdBy ?? null,
    ],
  )
  return findNewsById(result.insertId)
}

export async function updateNews(id, data) {
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
