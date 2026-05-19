import bcrypt from 'bcryptjs'
import {
  listUsers,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  findUserByUsername,
} from '../models/user.model.js'
import { findAreaProfileBySlug } from '../models/areaProfile.model.js'
import {
  listPermissionsByUserId,
  listPermissionsByUserIds,
  replacePermissionsForUser,
} from '../models/userResourcePermission.model.js'
import { mapUserPublic } from '../utils/mapNews.js'
import { AppError } from '../utils/AppError.js'
import { assertOptimisticLock } from '../utils/concurrency.js'

const VALID_ROLES = new Set(['admin', 'editor', 'area_service_editor'])

function normalizeUsername(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
}

function normalizeRole(role) {
  const value = String(role || 'editor').trim()
  return VALID_ROLES.has(value) ? value : 'editor'
}

function mapUserWithPermissions(row, permissions = []) {
  return {
    ...mapUserPublic(row),
    permissions,
  }
}

async function sanitizePermissions(rawPermissions = [], role = 'editor') {
  if (role === 'admin') return []
  if (!Array.isArray(rawPermissions)) return []

  const out = []
  const seen = new Set()
  for (const item of rawPermissions.slice(0, 30)) {
    if (item?.resourceType !== 'area_service') continue
    const areaSlug = String(item.areaSlug || '').trim()
    const resourceId = String(item.resourceId || '').trim()
    if (!areaSlug || !resourceId) continue
    const key = `${areaSlug}:${resourceId}`
    if (seen.has(key)) continue
    const profile = await findAreaProfileBySlug(areaSlug)
    const exists = Array.isArray(profile?.serviceBlocks)
      && profile.serviceBlocks.some((service) => String(service?.id || '') === resourceId)
    if (!exists) {
      throw new AppError(`El servicio seleccionado no existe en el área ${areaSlug}.`, 400)
    }
    seen.add(key)
    out.push({
      resourceType: 'area_service',
      areaSlug,
      resourceId,
      canUpdate: item.canUpdate !== false,
    })
  }
  return out
}

export async function getUsersList(query) {
  const limit = query.limit ? Number(query.limit) : 100
  const offset = query.offset ? Number(query.offset) : 0
  const { rows, total } = await listUsers({ limit, offset })
  const permissionsByUser = await listPermissionsByUserIds(rows.map((row) => row.id))
  return {
    items: rows.map((r) => mapUserWithPermissions(r, permissionsByUser.get(String(r.id)) || [])),
    total,
    limit: Math.min(limit, 500),
    offset: Math.max(offset, 0),
  }
}

export async function getUserById(id) {
  const user = await findUserById(Number(id))
  if (!user) throw new AppError('Usuario no encontrado.', 404)
  const permissions = await listPermissionsByUserId(Number(id))
  return mapUserWithPermissions(user, permissions)
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

  const role = normalizeRole(payload.role)
  const permissions = await sanitizePermissions(payload.permissions, role)
  const passwordHash = await bcrypt.hash(payload.password, 10)
  const row = await createUser({
    username,
    passwordHash,
    fullName: payload.fullName != null ? String(payload.fullName).trim() : '',
    role,
    isActive: payload.isActive !== false,
  })
  await replacePermissionsForUser(row.id, permissions)
  return getUserById(row.id)
}

export async function updateUserRecord(id, payload, { currentUserId }) {
  const existing = await findUserById(Number(id))
  if (!existing) throw new AppError('Usuario no encontrado.', 404)
  assertOptimisticLock(payload?.expectedUpdatedAt, existing.updated_at, 'usuario')

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
    data.role = normalizeRole(payload.role)
  }
  if (payload.isActive !== undefined) {
    if (Number(id) === Number(currentUserId) && payload.isActive === false) {
      throw new AppError('No podés desactivar tu propia cuenta.', 400)
    }
    data.isActive = payload.isActive
  }

  const nextRole = data.role || existing.role
  const nextPermissions =
    payload.permissions !== undefined || data.role !== undefined
      ? await sanitizePermissions(payload.permissions, nextRole)
      : null
  const row = await updateUser(Number(id), data)
  if (payload.permissions !== undefined || data.role !== undefined) {
    await replacePermissionsForUser(Number(id), nextPermissions)
  }
  return getUserById(row.id)
}

export async function removeUser(id, currentUserId) {
  if (Number(id) === Number(currentUserId)) {
    throw new AppError('No podés eliminar tu propio usuario.', 400)
  }
  const ok = await deleteUser(Number(id))
  if (!ok) throw new AppError('Usuario no encontrado.', 404)
}
