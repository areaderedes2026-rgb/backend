import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getAllNewsMapped,
  getOneNews,
  createNewsRecord,
  updateNewsRecord,
  removeNews,
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
  const item = await updateNewsRecord(req.params.id, req.body)
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
