import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getAreasPageContent,
  saveAreasPageContent,
} from '../services/areasPage.service.js'

export const getAreasPageContentCtrl = asyncHandler(async (req, res) => {
  const content = await getAreasPageContent()
  res.status(200).json({ ok: true, content })
})

export const putAreasPageContentCtrl = asyncHandler(async (req, res) => {
  const content = await saveAreasPageContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
