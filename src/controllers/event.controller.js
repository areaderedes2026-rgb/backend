import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createEvent,
  listAdminEvents,
  listPublicEvents,
  removeEvent,
  updateEvent,
} from '../services/event.service.js'

export const listEventsCtrl = asyncHandler(async (_req, res) => {
  const items = await listPublicEvents()
  res.status(200).json({ ok: true, items })
})

export const listEventsAdminCtrl = asyncHandler(async (_req, res) => {
  const items = await listAdminEvents()
  res.status(200).json({ ok: true, items })
})

export const postEventCtrl = asyncHandler(async (req, res) => {
  const item = await createEvent(req.body || {})
  res.status(201).json({ ok: true, item })
})

export const putEventCtrl = asyncHandler(async (req, res) => {
  const item = await updateEvent(req.params.id, req.body || {})
  res.status(200).json({ ok: true, item })
})

export const deleteEventCtrl = asyncHandler(async (req, res) => {
  await removeEvent(req.params.id)
  res.status(200).json({ ok: true })
})
