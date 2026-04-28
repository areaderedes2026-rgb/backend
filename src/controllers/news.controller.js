import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getAllNewsMapped,
  getOneNews,
  createNewsRecord,
  updateNewsRecord,
  removeNews,
  recordNewsInteraction,
  getNewsStatsDashboard,
} from '../services/news.service.js'
import { AppError } from '../utils/AppError.js'

export const listNews = asyncHandler(async (req, res) => {
  const items = await getAllNewsMapped()
  res.status(200).json(items)
})

export const getNews = asyncHandler(async (req, res) => {
  const item = await getOneNews(req.params.idOrSlug)
  if (!item) {
    throw new AppError('Noticia no encontrada.', 404)
  }
  res.status(200).json(item)
})

export const postNews = asyncHandler(async (req, res) => {
  const item = await createNewsRecord(req.body, req.user.id)
  res.status(201).json(item)
})

export const putNews = asyncHandler(async (req, res) => {
  const item = await updateNewsRecord(req.params.id, req.body, req.user?.id ?? null)
  if (!item) {
    throw new AppError('Noticia no encontrada.', 404)
  }
  res.status(200).json(item)
})

export const deleteNews = asyncHandler(async (req, res) => {
  const ok = await removeNews(req.params.id)
  if (!ok) {
    throw new AppError('Noticia no encontrada.', 404)
  }
  res.status(200).json({ ok: true, message: 'Noticia eliminada.' })
})

export const postNewsInteraction = asyncHandler(async (req, res) => {
  const { type, channel } = req.body || {}
  const item = await recordNewsInteraction(req.params.idOrSlug, type, channel)
  if (!item) {
    throw new AppError('Noticia no encontrada.', 404)
  }
  res.status(200).json({ ok: true, stats: item.stats })
})

export const getNewsStats = asyncHandler(async (_req, res) => {
  const data = await getNewsStatsDashboard()
  res.status(200).json(data)
})
