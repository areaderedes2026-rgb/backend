import { asyncHandler } from '../utils/asyncHandler.js'
import { getAreaProfile, saveAreaProfile } from '../services/areaProfile.service.js'

export const getAreaProfileBySlug = asyncHandler(async (req, res) => {
  const profile = await getAreaProfile(req.params.slug)
  res.status(200).json({ ok: true, profile })
})

export const putAreaProfileBySlug = asyncHandler(async (req, res) => {
  const profile = await saveAreaProfile(req.params.slug, req.body || {})
  res.status(200).json({ ok: true, profile })
})
