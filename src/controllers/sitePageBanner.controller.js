import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getSitePageBanner,
  saveSitePageBanner,
} from '../services/sitePageBanner.service.js'

export const getSitePageBannerCtrl = asyncHandler(async (req, res) => {
  const content = await getSitePageBanner(req.params.pageKey)
  res.status(200).json({ ok: true, content })
})

export const putSitePageBannerCtrl = asyncHandler(async (req, res) => {
  const content = await saveSitePageBanner(req.params.pageKey, req.body || {})
  res.status(200).json({ ok: true, content })
})
