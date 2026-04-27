import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getCategoriesList,
  getCategoryById,
  createCategoryRecord,
  updateCategoryRecord,
  removeCategory,
} from '../services/category.service.js'

export const listCategories = asyncHandler(async (req, res) => {
  const items = await getCategoriesList()
  res.status(200).json({ ok: true, items })
})

export const getCategory = asyncHandler(async (req, res) => {
  const category = await getCategoryById(req.params.id)
  res.status(200).json({ ok: true, category })
})

export const postCategory = asyncHandler(async (req, res) => {
  const category = await createCategoryRecord(req.body)
  res.status(201).json({ ok: true, category })
})

export const putCategory = asyncHandler(async (req, res) => {
  const category = await updateCategoryRecord(req.params.id, req.body)
  res.status(200).json({ ok: true, category })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  await removeCategory(req.params.id)
  res.status(200).json({ ok: true, message: 'Categoría eliminada.' })
})
