import { asyncHandler } from '../utils/asyncHandler.js'
import { getHistoryContent, saveHistoryContent } from '../services/history.service.js'

export const getHistory = asyncHandler(async (req, res) => {
  const content = await getHistoryContent()
  res.status(200).json({ ok: true, content })
})

export const putHistory = asyncHandler(async (req, res) => {
  const content = await saveHistoryContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
