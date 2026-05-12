import { pool } from '../config/db.js'

function parseActivitiesJson(raw) {
  if (raw == null) return []
  let parsed = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  return parsed
    .map((x) => String(x == null ? '' : x).trim())
    .filter(Boolean)
    .slice(0, 80)
}

function mapRow(row) {
  if (!row) return null
  return {
    id: Number(row.id),
    areaSlug: row.area_slug,
    officeSlug: row.office_slug,
    name: row.name || '',
    iconKey: row.icon_key || 'building',
    description: row.description || '',
    activities: parseActivitiesJson(row.activities_json),
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listAreaOfficesByAreaSlug(areaSlug) {
  const [rows] = await pool.query(
    `SELECT id, area_slug, office_slug, name, icon_key, description, activities_json, sort_order, created_at, updated_at
     FROM area_offices
     WHERE area_slug = ?
     ORDER BY sort_order ASC, id ASC`,
    [areaSlug],
  )
  return rows.map(mapRow)
}

export async function findAreaOfficeByAreaAndSlug(areaSlug, officeSlug) {
  const [rows] = await pool.query(
    `SELECT id, area_slug, office_slug, name, icon_key, description, activities_json, sort_order, created_at, updated_at
     FROM area_offices
     WHERE area_slug = ? AND office_slug = ?
     LIMIT 1`,
    [areaSlug, officeSlug],
  )
  return mapRow(rows[0] ?? null)
}

export async function findAreaOfficeById(id) {
  const [rows] = await pool.query(
    `SELECT id, area_slug, office_slug, name, icon_key, description, activities_json, sort_order, created_at, updated_at
     FROM area_offices
     WHERE id = ?
     LIMIT 1`,
    [id],
  )
  return mapRow(rows[0] ?? null)
}

export async function findAreaOfficeByAreaSlugAndId(areaSlug, id) {
  const [rows] = await pool.query(
    `SELECT id, area_slug, office_slug, name, icon_key, description, activities_json, sort_order, created_at, updated_at
     FROM area_offices
     WHERE area_slug = ? AND id = ?
     LIMIT 1`,
    [areaSlug, id],
  )
  return mapRow(rows[0] ?? null)
}

export async function createAreaOfficeRow({
  areaSlug,
  officeSlug,
  name,
  iconKey,
  description,
  activities,
  sortOrder,
}) {
  const [result] = await pool.query(
    `INSERT INTO area_offices (area_slug, office_slug, name, icon_key, description, activities_json, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      areaSlug,
      officeSlug,
      name,
      iconKey,
      description,
      JSON.stringify(activities),
      sortOrder,
    ],
  )
  return findAreaOfficeById(result.insertId)
}

export async function updateAreaOfficeRow(id, data) {
  const fields = []
  const values = []
  if (data.officeSlug !== undefined) {
    fields.push('office_slug = ?')
    values.push(data.officeSlug)
  }
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.iconKey !== undefined) {
    fields.push('icon_key = ?')
    values.push(data.iconKey)
  }
  if (data.description !== undefined) {
    fields.push('description = ?')
    values.push(data.description)
  }
  if (data.activities !== undefined) {
    fields.push('activities_json = ?')
    values.push(JSON.stringify(data.activities))
  }
  if (data.sortOrder !== undefined) {
    fields.push('sort_order = ?')
    values.push(data.sortOrder)
  }
  if (fields.length === 0) return findAreaOfficeById(id)
  values.push(id)
  await pool.query(`UPDATE area_offices SET ${fields.join(', ')} WHERE id = ?`, values)
  return findAreaOfficeById(id)
}

export async function deleteAreaOfficeRow(id) {
  const [result] = await pool.query('DELETE FROM area_offices WHERE id = ?', [id])
  return result.affectedRows > 0
}

export async function countOfficesBySlugPair(areaSlug, officeSlug, excludeId = null) {
  const sql =
    excludeId != null
      ? 'SELECT COUNT(*) AS n FROM area_offices WHERE area_slug = ? AND office_slug = ? AND id <> ?'
      : 'SELECT COUNT(*) AS n FROM area_offices WHERE area_slug = ? AND office_slug = ?'
  const params =
    excludeId != null ? [areaSlug, officeSlug, excludeId] : [areaSlug, officeSlug]
  const [rows] = await pool.query(sql, params)
  return Number(rows[0]?.n) || 0
}
