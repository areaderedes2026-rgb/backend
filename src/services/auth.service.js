import bcrypt from 'bcryptjs'
import { findUserByUsername } from '../models/user.model.js'
import { signToken } from '../utils/jwt.js'
import { mapUserPublic } from '../utils/mapNews.js'
import { AppError } from '../utils/AppError.js'

export async function login(username, password) {
  const user = await findUserByUsername(username)
  if (!user || !user.is_active) {
    throw new AppError('Credenciales inválidas.', 401)
  }
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    throw new AppError('Credenciales inválidas.', 401)
  }

  const publicUser = mapUserPublic(user)
  const token = signToken({
    sub: user.id,
    username: user.username,
    role: user.role,
  })

  return { token, user: publicUser }
}
