import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getUsersList,
  getUserById,
  createUserRecord,
  updateUserRecord,
  removeUser,
} from '../services/user.service.js'

export const listUsers = asyncHandler(async (req, res) => {
  const data = await getUsersList(req.query)
  res.status(200).json({ ok: true, ...data })
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id)
  res.status(200).json({ ok: true, user })
})

export const postUser = asyncHandler(async (req, res) => {
  const user = await createUserRecord(req.body)
  res.status(201).json({ ok: true, user })
})

export const putUser = asyncHandler(async (req, res) => {
  const user = await updateUserRecord(req.params.id, req.body, {
    currentUserId: req.user.id,
  })
  res.status(200).json({ ok: true, user })
})

export const deleteUser = asyncHandler(async (req, res) => {
  await removeUser(req.params.id, req.user.id)
  res.status(200).json({ ok: true, message: 'Usuario eliminado.' })
})
