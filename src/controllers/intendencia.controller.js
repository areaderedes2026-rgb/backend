import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getIntendenciaContent,
  saveIntendenciaContent,
} from '../services/intendencia.service.js'

export const getIntendenciaCtrl = asyncHandler(async (_req, res) => {
  const content = await getIntendenciaContent()
  res.status(200).json({ ok: true, content })
})

export const putIntendenciaCtrl = asyncHandler(async (req, res) => {
  const content = await saveIntendenciaContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
