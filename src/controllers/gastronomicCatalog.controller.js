import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getGastronomicCatalogContent,
  saveGastronomicCatalogContent,
} from '../services/gastronomicCatalog.service.js'

export const getGastronomicCatalogCtrl = asyncHandler(async (_req, res) => {
  const content = await getGastronomicCatalogContent()
  res.status(200).json({ ok: true, content })
})

export const putGastronomicCatalogCtrl = asyncHandler(async (req, res) => {
  const content = await saveGastronomicCatalogContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
