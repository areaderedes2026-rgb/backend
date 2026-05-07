import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getConcejoDeliberanteContent,
  saveConcejoDeliberanteContent,
} from '../services/concejoDeliberante.service.js'

export const getConcejoDeliberanteCtrl = asyncHandler(async (_req, res) => {
  const content = await getConcejoDeliberanteContent()
  res.status(200).json({ ok: true, content })
})

export const putConcejoDeliberanteCtrl = asyncHandler(async (req, res) => {
  const content = await saveConcejoDeliberanteContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
