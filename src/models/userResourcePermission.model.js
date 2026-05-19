import { pool } from '../config/db.js'

function mapPermission(row) {
  if (!row) return null
  return {
    id: String(row.id),
    userId: String(row.user_id),
    resourceType: row.resource_type,
    areaSlug: row.area_slug || '',
    resourceId: row.resource_id || '',
    canUpdate: row.can_update !== 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listPermissionsByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT *
     FROM user_resource_permissions
     WHERE user_id = ?
     ORDER BY resource_type ASC, area_slug ASC, resource_id ASC`,
    [userId],
  )
  return rows.map(mapPermission).filter(Boolean)
}

export async function listPermissionsByUserIds(userIds) {
  const ids = [...new Set((userIds || []).map((id) => Number(id)).filter(Boolean))]
  if (!ids.length) return new Map()
  const [rows] = await pool.query(
    `SELECT *
     FROM user_resource_permissions
     WHERE user_id IN (?)
     ORDER BY resource_type ASC, area_slug ASC, resource_id ASC`,
    [ids],
  )
  const out = new Map(ids.map((id) => [String(id), []]))
  rows.forEach((row) => {
    const mapped = mapPermission(row)
    if (!mapped) return
    const key = String(row.user_id)
    out.set(key, [...(out.get(key) || []), mapped])
  })
  return out
}

export async function replacePermissionsForUser(userId, permissions = []) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query('DELETE FROM user_resource_permissions WHERE user_id = ?', [userId])

    const values = permissions
      .filter((item) => item?.resourceType === 'area_service' && item?.areaSlug && item?.resourceId)
      .map((item) => [
        userId,
        'area_service',
        String(item.areaSlug).trim(),
        String(item.resourceId).trim(),
        item.canUpdate === false ? 0 : 1,
      ])

    if (values.length) {
      await conn.query(
        `INSERT INTO user_resource_permissions
          (user_id, resource_type, area_slug, resource_id, can_update)
         VALUES ?`,
        [values],
      )
    }

    await conn.commit()
  } catch (e) {
    await conn.rollback()
    throw e
  } finally {
    conn.release()
  }
  return listPermissionsByUserId(userId)
}

export async function userHasAreaServicePermission(userId, areaSlug, serviceId) {
  const [rows] = await pool.query(
    `SELECT id
     FROM user_resource_permissions
     WHERE user_id = ?
       AND resource_type = 'area_service'
       AND area_slug = ?
       AND resource_id = ?
       AND can_update = 1
     LIMIT 1`,
    [userId, areaSlug, serviceId],
  )
  return rows.length > 0
}

export async function listAreaServicePermissionsForUser(userId) {
  return listPermissionsByUserId(userId).then((items) =>
    items.filter((item) => item.resourceType === 'area_service' && item.canUpdate),
  )
}
