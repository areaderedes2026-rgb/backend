import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createTourismPlace,
  editTourismPlace,
  getTourismPlacePublicBySlug,
  getTourismPlacesAdmin,
  getTourismPlacesPublic,
  removeTourismPlace,
} from '../services/tourismPlace.service.js'

export const listTourismPlaces = asyncHandler(async (req, res) => {
  const places = await getTourismPlacesPublic()
  res.status(200).json({ ok: true, places })
})

export const getTourismPlace = asyncHandler(async (req, res) => {
  const place = await getTourismPlacePublicBySlug(req.params.slug)
  res.status(200).json({ ok: true, place })
})

export const listTourismPlacesAdminCtrl = asyncHandler(async (req, res) => {
  const places = await getTourismPlacesAdmin()
  res.status(200).json({ ok: true, places })
})

export const postTourismPlace = asyncHandler(async (req, res) => {
  const place = await createTourismPlace(req.body || {})
  res.status(201).json({ ok: true, place })
})

export const putTourismPlace = asyncHandler(async (req, res) => {
  const place = await editTourismPlace(req.params.id, req.body || {})
  res.status(200).json({ ok: true, place })
})

export const deleteTourismPlace = asyncHandler(async (req, res) => {
  await removeTourismPlace(req.params.id)
  res.status(200).json({ ok: true })
})
