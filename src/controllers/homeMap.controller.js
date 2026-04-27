import { asyncHandler } from '../utils/asyncHandler.js'
import { getHomeMapContent, saveHomeMapContent } from '../services/homeMap.service.js'

export const getHomeMap = asyncHandler(async (req, res) => {
  const content = await getHomeMapContent()
  res.status(200).json({ ok: true, content })
})

export const putHomeMap = asyncHandler(async (req, res) => {
  const content = await saveHomeMapContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
