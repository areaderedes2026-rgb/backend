import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getHomeEmergencyContent,
  saveHomeEmergencyContent,
} from '../services/homeEmergency.service.js'

export const getHomeEmergency = asyncHandler(async (req, res) => {
  const content = await getHomeEmergencyContent()
  res.status(200).json({ ok: true, content })
})

export const putHomeEmergency = asyncHandler(async (req, res) => {
  const content = await saveHomeEmergencyContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
