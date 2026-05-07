import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getLegisladorEsteContent,
  saveLegisladorEsteContent,
} from '../services/legisladorEste.service.js'

export const getLegisladorEsteCtrl = asyncHandler(async (_req, res) => {
  const content = await getLegisladorEsteContent()
  res.status(200).json({ ok: true, content })
})

export const putLegisladorEsteCtrl = asyncHandler(async (req, res) => {
  const content = await saveLegisladorEsteContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
