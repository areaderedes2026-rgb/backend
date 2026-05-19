import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getAreaProfile,
  getAreaProfileService,
  listMyAreaProfileServices,
  saveAreaProfile,
  saveAreaProfileService,
} from '../services/areaProfile.service.js'

export const getAreaProfileBySlug = asyncHandler(async (req, res) => {
  const profile = await getAreaProfile(req.params.slug)
  res.status(200).json({ ok: true, profile })
})

export const putAreaProfileBySlug = asyncHandler(async (req, res) => {
  const profile = await saveAreaProfile(req.params.slug, req.body || {}, req.user)
  res.status(200).json({ ok: true, profile })
})

export const getAreaProfileServiceById = asyncHandler(async (req, res) => {
  const data = await getAreaProfileService(req.params.slug, req.params.serviceId, req.user)
  res.status(200).json({ ok: true, ...data })
})

export const putAreaProfileServiceById = asyncHandler(async (req, res) => {
  const data = await saveAreaProfileService(req.params.slug, req.params.serviceId, req.body || {}, req.user)
  res.status(200).json({ ok: true, ...data })
})

export const getMyAreaProfileServices = asyncHandler(async (req, res) => {
  const items = await listMyAreaProfileServices(req.user)
  res.status(200).json({ ok: true, items })
})
