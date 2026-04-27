import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getPublicAreasList,
  getAreaPublicBySlug,
  getAreasAdminList,
  createAreaRecord,
  updateAreaRecord,
  removeAreaRecord,
} from '../services/area.service.js'

export const listAreas = asyncHandler(async (req, res) => {
  const items = await getPublicAreasList()
  res.status(200).json({ ok: true, items })
})

export const getArea = asyncHandler(async (req, res) => {
  const area = await getAreaPublicBySlug(req.params.slug)
  res.status(200).json({ ok: true, area })
})

export const listAreasAdmin = asyncHandler(async (req, res) => {
  const items = await getAreasAdminList()
  res.status(200).json({ ok: true, items })
})

export const postArea = asyncHandler(async (req, res) => {
  const area = await createAreaRecord(req.body || {})
  res.status(201).json({ ok: true, area })
})

export const putArea = asyncHandler(async (req, res) => {
  const area = await updateAreaRecord(req.params.id, req.body || {})
  res.status(200).json({ ok: true, area })
})

export const deleteArea = asyncHandler(async (req, res) => {
  await removeAreaRecord(req.params.id)
  res.status(200).json({ ok: true, message: 'Área eliminada.' })
})
