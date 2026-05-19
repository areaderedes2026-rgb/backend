import { asyncHandler } from '../utils/asyncHandler.js'
import { getHomeHeroContent, saveHomeHeroContent } from '../services/homeHero.service.js'

export const getHomeHero = asyncHandler(async (req, res) => {
  const content = await getHomeHeroContent()
  res.status(200).json({ ok: true, content })
})

export const putHomeHero = asyncHandler(async (req, res) => {
  const content = await saveHomeHeroContent(req.body || {})
  res.status(200).json({ ok: true, content })
})
