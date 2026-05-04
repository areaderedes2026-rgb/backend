import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getOfertaAcademicaContent,
  saveOfertaAcademicaContent,
} from '../services/ofertaAcademica.service.js'

export const getOfertaAcademicaCtrl = asyncHandler(async (_req, res) => {
  const content = await getOfertaAcademicaContent()
  res.status(200).json({ ok: true, content })
})

export const putOfertaAcademicaCtrl = asyncHandler(async (req, res) => {
  const content = await saveOfertaAcademicaContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
