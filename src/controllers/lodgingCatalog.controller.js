import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getLodgingCatalogContent,
  saveLodgingCatalogContent,
} from '../services/lodgingCatalog.service.js'

export const getLodgingCatalogCtrl = asyncHandler(async (_req, res) => {
  const content = await getLodgingCatalogContent()
  res.status(200).json({ ok: true, content })
})

export const putLodgingCatalogCtrl = asyncHandler(async (req, res) => {
  const content = await saveLodgingCatalogContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
