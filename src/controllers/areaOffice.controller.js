import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createAreaOffice,
  getPublicOfficeBySlugs,
  listAdminOfficesByAreaSlug,
  listPublicOfficesByAreaSlug,
  removeAreaOffice,
  updateAreaOffice,
} from '../services/areaOffice.service.js'

export const listPublicAreaOffices = asyncHandler(async (req, res) => {
  const items = await listPublicOfficesByAreaSlug(req.params.slug)
  res.status(200).json({ ok: true, items })
})

export const getPublicAreaOffice = asyncHandler(async (req, res) => {
  const office = await getPublicOfficeBySlugs(req.params.slug, req.params.officeSlug)
  res.status(200).json({ ok: true, office })
})

export const listAdminAreaOffices = asyncHandler(async (req, res) => {
  const items = await listAdminOfficesByAreaSlug(req.params.slug)
  res.status(200).json({ ok: true, items })
})

export const postAdminAreaOffice = asyncHandler(async (req, res) => {
  const office = await createAreaOffice(req.params.slug, req.body || {})
  res.status(201).json({ ok: true, office })
})

export const putAdminAreaOffice = asyncHandler(async (req, res) => {
  const office = await updateAreaOffice(req.params.slug, req.params.id, req.body || {})
  res.status(200).json({ ok: true, office })
})

export const deleteAdminAreaOffice = asyncHandler(async (req, res) => {
  await removeAreaOffice(req.params.slug, req.params.id)
  res.status(200).json({ ok: true, message: 'Oficina eliminada.' })
})
