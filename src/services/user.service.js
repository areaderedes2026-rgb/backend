import bcrypt from 'bcryptjs'
import {
  listUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  findUserByUsername,
} from '../models/user.model.js'
import { mapUserPublic } from '../utils/mapNews.js'
import { AppError } from '../utils/AppError.js'

function normalizeUsername(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
}

export async function getUsersList(query) {
  const limit = query.limit ? Number(query.limit) : 100
  const offset = query.offset ? Number(query.offset) : 0
  const { rows, total } = await listUsers({ limit, offset })
  return {
    items: rows.map((r) => mapUserPublic(r)),
    total,
    limit: Math.min(limit, 500),
    offset: Math.max(offset, 0),
  }
}

export async function getUserById(id) {
  const user = await findUserById(Number(id))
  if (!user) throw new AppError('Usuario no encontrado.', 404)
  return mapUserPublic(user)
}

export async function createUserRecord(payload) {
  const username = normalizeUsername(payload.username)
  if (!username) {
    throw new AppError('El nombre de usuario es obligatorio.', 400)
  }
  const existingU = await findUserByUsername(username)
  if (existingU) {
    throw new AppError('Ya existe un usuario con ese nombre de usuario.', 409)
  }

  const passwordHash = await bcrypt.hash(payload.password, 10)
  const row = await createUser({
    username,
    passwordHash,
    fullName: payload.fullName != null ? String(payload.fullName).trim() : '',
    role: payload.role === 'admin' ? 'admin' : 'editor',
    isActive: payload.isActive !== false,
  })
  return mapUserPublic(row)
}

export async function updateUserRecord(id, payload, { currentUserId }) {
  const existing = await findUserById(Number(id))
  if (!existing) throw new AppError('Usuario no encontrado.', 404)

  const data = {}

  if (payload.username !== undefined) {
    const username = normalizeUsername(payload.username)
    if (!username) {
      throw new AppError('El nombre de usuario no puede quedar vacío.', 400)
    }
    const other = await findUserByUsername(username)
    if (other && other.id !== existing.id) {
      throw new AppError('Ya existe un usuario con ese nombre de usuario.', 409)
    }
    data.username = username
  }

  if (payload.password) {
    data.passwordHash = await bcrypt.hash(payload.password, 10)
  }
  if (payload.fullName !== undefined) {
    data.fullName = String(payload.fullName).trim()
  }
  if (payload.role !== undefined) {
    data.role = payload.role === 'admin' ? 'admin' : 'editor'
  }
  if (payload.isActive !== undefined) {
    if (Number(id) === Number(currentUserId) && payload.isActive === false) {
      throw new AppError('No podés desactivar tu propia cuenta.', 400)
    }
    data.isActive = payload.isActive
  }

  const row = await updateUser(Number(id), data)
  return mapUserPublic(row)
}

export async function removeUser(id, currentUserId) {
  if (Number(id) === Number(currentUserId)) {
    throw new AppError('No podés eliminar tu propio usuario.', 400)
  }
  const ok = await deleteUser(Number(id))
  if (!ok) throw new AppError('Usuario no encontrado.', 404)
}
