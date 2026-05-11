import { asyncHandler } from '../utils/asyncHandler.js'
import { normalizeSearchQuery, runGlobalSearch } from '../services/search.service.js'

export const searchPublicCtrl = asyncHandler(async (req, res) => {
  const normalized = normalizeSearchQuery(req.query.q)
  if (!normalized) {
    res.status(200).json({ ok: true, items: [] })
    return
  }
  const items = await runGlobalSearch(normalized)
  res.status(200).json({ ok: true, items: items.slice(0, 24) })
})
