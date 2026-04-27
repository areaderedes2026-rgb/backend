import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createCitizenInquiry,
  getCitizenAttentionContent,
  getCitizenInquiryAdmin,
  listCitizenInquiriesAdmin,
  removeCitizenInquiry,
  saveCitizenAttentionContent,
  setCitizenInquiryStatus,
} from '../services/citizenAttention.service.js'

export const getCitizenAttentionContentCtrl = asyncHandler(async (req, res) => {
  const content = await getCitizenAttentionContent()
  res.status(200).json({ ok: true, content })
})

export const putCitizenAttentionContentCtrl = asyncHandler(async (req, res) => {
  const content = await saveCitizenAttentionContent(req.body || {})
  res.status(200).json({ ok: true, content })
})

export const postCitizenInquiryCtrl = asyncHandler(async (req, res) => {
  const inquiry = await createCitizenInquiry(req.body || {})
  res.status(201).json({ ok: true, inquiry })
})

export const listCitizenInquiriesAdminCtrl = asyncHandler(async (req, res) => {
  const inquiries = await listCitizenInquiriesAdmin({ status: req.query.status })
  res.status(200).json({ ok: true, inquiries })
})

export const getCitizenInquiryAdminCtrl = asyncHandler(async (req, res) => {
  const inquiry = await getCitizenInquiryAdmin(req.params.id)
  res.status(200).json({ ok: true, inquiry })
})

export const patchCitizenInquiryStatusCtrl = asyncHandler(async (req, res) => {
  const inquiry = await setCitizenInquiryStatus(req.params.id, req.body?.status)
  res.status(200).json({ ok: true, inquiry })
})

export const deleteCitizenInquiryCtrl = asyncHandler(async (req, res) => {
  await removeCitizenInquiry(req.params.id)
  res.status(200).json({ ok: true })
})
