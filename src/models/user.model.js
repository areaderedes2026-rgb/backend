import { pool } from '../config/db.js'

export async function findUserByUsername(username) {
  const u = String(username || '').trim().toLowerCase()
  if (!u) return null
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [u],
  )
  return rows[0] ?? null
}

export async function findUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [
    id,
  ])
  return rows[0] ?? null
}

export async function listUsers({ limit = 100, offset = 0 } = {}) {
  const safeLimit = Math.min(Number(limit) || 100, 500)
  const safeOffset = Math.max(Number(offset) || 0, 0)
  const [rows] = await pool.query(
    `SELECT id, username, full_name, role, is_active, created_at, updated_at
     FROM users
     ORDER BY id ASC
     LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset],
  )
  const [[{ total }]] = await pool.query(
    'SELECT COUNT(*) AS total FROM users',
  )
  return { rows, total: Number(total) }
}

export async function createUser({
  username,
  passwordHash,
  fullName,
  role = 'editor',
  isActive = true,
}) {
  const [result] = await pool.query(
    `INSERT INTO users (username, password_hash, full_name, role, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [username, passwordHash, fullName, role, isActive ? 1 : 0],
  )
  return findUserById(result.insertId)
}

export async function updateUser(id, data) {
  const fields = []
  const values = []

  if (data.username !== undefined) {
    fields.push('username = ?')
    values.push(data.username)
  }
  if (data.passwordHash !== undefined) {
    fields.push('password_hash = ?')
    values.push(data.passwordHash)
  }
  if (data.fullName !== undefined) {
    fields.push('full_name = ?')
    values.push(data.fullName)
  }
  if (data.role !== undefined) {
    fields.push('role = ?')
    values.push(data.role)
  }
  if (data.isActive !== undefined) {
    fields.push('is_active = ?')
    values.push(data.isActive ? 1 : 0)
  }

  if (fields.length === 0) return findUserById(id)

  values.push(id)
  await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values,
  )
  return findUserById(id)
}

export async function deleteUser(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id])
  return result.affectedRows > 0
}
