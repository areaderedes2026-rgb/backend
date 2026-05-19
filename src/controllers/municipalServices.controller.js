import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createMunicipalService,
  editMunicipalService,
  getMunicipalServicesAdmin,
  getMunicipalServicesPublic,
  getServicesPageContentPublic,
  removeMunicipalService,
  saveServicesPageContent,
} from '../services/municipalServices.service.js'

export const getServicesPageContentCtrl = asyncHandler(async (req, res) => {
  const content = await getServicesPageContentPublic()
  res.status(200).json({ ok: true, content })
})

export const putServicesPageContentCtrl = asyncHandler(async (req, res) => {
  const content = await saveServicesPageContent(req.body || {})
  res.status(200).json({ ok: true, content })
})

export const listMunicipalServicesPublicCtrl = asyncHandler(async (req, res) => {
  const services = await getMunicipalServicesPublic()
  res.status(200).json({ ok: true, services })
})

export const listMunicipalServicesAdminCtrl = asyncHandler(async (req, res) => {
  const services = await getMunicipalServicesAdmin()
  res.status(200).json({ ok: true, services })
})

export const postMunicipalServiceCtrl = asyncHandler(async (req, res) => {
  const service = await createMunicipalService(req.body || {})
  res.status(201).json({ ok: true, service })
})

export const putMunicipalServiceCtrl = asyncHandler(async (req, res) => {
  const service = await editMunicipalService(req.params.id, req.body || {})
  res.status(200).json({ ok: true, service })
})

export const deleteMunicipalServiceCtrl = asyncHandler(async (req, res) => {
  await removeMunicipalService(req.params.id)
  res.status(200).json({ ok: true })
})
