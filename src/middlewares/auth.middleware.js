import { verifyToken } from '../utils/jwt.js'
import { findUserById } from '../models/user.model.js'
import { AppError } from '../utils/AppError.js'

/**
 * Requiere cabecera Authorization: Bearer <token>
 */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [type, token] = header.split(' ')
    if (type !== 'Bearer' || !token) {
      throw new AppError('No autorizado.', 401)
    }
    const decoded = verifyToken(token)
    const userId = decoded.sub
    const user = await findUserById(userId)
    if (!user || !user.is_active) {
      throw new AppError('No autorizado.', 401)
    }
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
    }
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      next(new AppError('Token inválido o expirado.', 401))
      return
    }
    next(err)
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      next(new AppError('No autorizado.', 401))
      return
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError('No tenés permiso para esta acción.', 403))
      return
    }
    next()
  }
}

/** Solo administradores (gestión de usuarios). */
export const requireAdmin = requireRole('admin')

/** Administrador o editor (noticias). */
export const requireStaff = requireRole('admin', 'editor')
