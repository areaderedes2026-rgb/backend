import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createCitizenInquiry,
  getCitizenAttentionContent,
  getCitizenInquiryAdmin,
  getInquiryWhatsappTemplate,
  listCitizenInquiriesAdmin,
  removeCitizenInquiry,
  saveCitizenAttentionContent,
  saveInquiryWhatsappTemplate,
  setCitizenInquiryStatus,
} from '../services/citizenAttention.service.js'

function stripInternalContentFields(content) {
  if (!content) return null
  const { inquiryWhatsappMessage, ...rest } = content
  return rest
}

export const getCitizenAttentionContentCtrl = asyncHandler(async (req, res) => {
  const content = await getCitizenAttentionContent()
  res.status(200).json({ ok: true, content: stripInternalContentFields(content) })
})

export const putCitizenAttentionContentCtrl = asyncHandler(async (req, res) => {
  const content = await saveCitizenAttentionContent(req.body || {})
  res.status(200).json({ ok: true, content: stripInternalContentFields(content) })
})

export const getInquiryWhatsappTemplateCtrl = asyncHandler(async (req, res) => {
  const data = await getInquiryWhatsappTemplate()
  res.status(200).json({ ok: true, message: data.message, updatedAt: data.updatedAt })
})

export const putInquiryWhatsappTemplateCtrl = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const data = await saveInquiryWhatsappTemplate({
    message: body.message,
    expectedUpdatedAt: body.expectedUpdatedAt,
  })
  res.status(200).json({ ok: true, message: data.message, updatedAt: data.updatedAt })
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
  const inquiry = await setCitizenInquiryStatus(
    req.params.id,
    req.body?.status,
    req.body?.expectedUpdatedAt,
  )
  res.status(200).json({ ok: true, inquiry })
})

export const deleteCitizenInquiryCtrl = asyncHandler(async (req, res) => {
  await removeCitizenInquiry(req.params.id)
  res.status(200).json({ ok: true })
})
