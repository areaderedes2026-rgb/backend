import { asyncHandler } from '../utils/asyncHandler.js'
import { login } from '../services/auth.service.js'
import { mapUserPublic } from '../utils/mapNews.js'
import { findUserById } from '../models/user.model.js'
import { AppError } from '../utils/AppError.js'

export const postLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body
  const result = await login(username, password)
  res.status(200).json({
    ok: true,
    token: result.token,
    user: result.user,
  })
})

export const getMe = asyncHandler(async (req, res) => {
  const row = await findUserById(req.user.id)
  if (!row || !row.is_active) {
    throw new AppError('Usuario no encontrado o inactivo.', 401)
  }
  res.status(200).json({
    ok: true,
    user: mapUserPublic(row),
  })
})
