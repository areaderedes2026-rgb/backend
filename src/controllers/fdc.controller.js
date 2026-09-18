import { asyncHandler } from '../utils/asyncHandler.js'
import {
  createFdcFaqInquiry,
  createFdcStallApplication,
  getFdcFaqInquiryAdmin,
  getFdcFaqInquiryWhatsappTemplate,
  getFdcPageContentAdmin,
  getFdcPageContentPublic,
  getFdcStallApplicationAdmin,
  getFdcWhatsappTemplate,
  listFdcFaqInquiriesAdmin,
  listFdcStallApplicationsAdmin,
  removeFdcFaqInquiry,
  removeFdcStallApplication,
  resendFdcStallConfirmationEmail,
  saveFdcFaqInquiryWhatsappTemplate,
  saveFdcPageContent,
  saveFdcWhatsappTemplate,
  setFdcFaqInquiryStatus,
  setFdcStallApplicationStatus,
} from '../services/fdc.service.js'

function stripInternal(content) {
  if (!content) return null
  const { whatsappMessage, ...rest } = content
  return rest
}

export const getFdcContentCtrl = asyncHandler(async (_req, res) => {
  const content = await getFdcPageContentPublic()
  res.status(200).json({ ok: true, content })
})

export const putFdcContentCtrl = asyncHandler(async (req, res) => {
  const content = await saveFdcPageContent(req.body || {})
  res.status(200).json({ ok: true, content: stripInternal(content) })
})

export const getFdcContentAdminCtrl = asyncHandler(async (_req, res) => {
  const content = await getFdcPageContentAdmin()
  res.status(200).json({ ok: true, content })
})

export const getFdcWhatsappTemplateCtrl = asyncHandler(async (_req, res) => {
  const data = await getFdcWhatsappTemplate()
  res.status(200).json({ ok: true, message: data.message, updatedAt: data.updatedAt })
})

export const putFdcWhatsappTemplateCtrl = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const data = await saveFdcWhatsappTemplate({
    message: body.message,
    expectedUpdatedAt: body.expectedUpdatedAt,
    forceOverwrite: Boolean(body.forceOverwrite),
  })
  res.status(200).json({ ok: true, message: data.message, updatedAt: data.updatedAt })
})

export const postFdcStallApplicationCtrl = asyncHandler(async (req, res) => {
  const result = await createFdcStallApplication(req.body || {})
  res.status(201).json({
    ok: true,
    application: result.application,
    emailSent: result.emailSent,
    emailQueued: result.emailQueued,
    emailError: result.emailError || '',
  })
})

export const listFdcStallApplicationsAdminCtrl = asyncHandler(async (req, res) => {
  const applications = await listFdcStallApplicationsAdmin({ status: req.query.status })
  res.status(200).json({ ok: true, applications })
})

export const getFdcStallApplicationAdminCtrl = asyncHandler(async (req, res) => {
  const application = await getFdcStallApplicationAdmin(req.params.id)
  res.status(200).json({ ok: true, application })
})

export const patchFdcStallApplicationStatusCtrl = asyncHandler(async (req, res) => {
  const application = await setFdcStallApplicationStatus(
    req.params.id,
    req.body?.status,
    req.body?.expectedUpdatedAt,
    Boolean(req.body?.forceOverwrite),
  )
  res.status(200).json({ ok: true, application })
})

export const deleteFdcStallApplicationCtrl = asyncHandler(async (req, res) => {
  await removeFdcStallApplication(req.params.id)
  res.status(200).json({ ok: true })
})

export const resendFdcStallEmailCtrl = asyncHandler(async (req, res) => {
  const application = await resendFdcStallConfirmationEmail(req.params.id)
  res.status(200).json({ ok: true, application, emailSent: true })
})

export const postFdcFaqInquiryCtrl = asyncHandler(async (req, res) => {
  const inquiry = await createFdcFaqInquiry(req.body || {})
  res.status(201).json({ ok: true, inquiry })
})

export const listFdcFaqInquiriesAdminCtrl = asyncHandler(async (req, res) => {
  const inquiries = await listFdcFaqInquiriesAdmin({ status: req.query.status })
  res.status(200).json({ ok: true, inquiries })
})

export const getFdcFaqInquiryAdminCtrl = asyncHandler(async (req, res) => {
  const inquiry = await getFdcFaqInquiryAdmin(req.params.id)
  res.status(200).json({ ok: true, inquiry })
})

export const patchFdcFaqInquiryStatusCtrl = asyncHandler(async (req, res) => {
  const inquiry = await setFdcFaqInquiryStatus(
    req.params.id,
    req.body?.status,
    req.body?.expectedUpdatedAt,
    Boolean(req.body?.forceOverwrite),
  )
  res.status(200).json({ ok: true, inquiry })
})

export const deleteFdcFaqInquiryCtrl = asyncHandler(async (req, res) => {
  await removeFdcFaqInquiry(req.params.id)
  res.status(200).json({ ok: true })
})

export const getFdcFaqInquiryWhatsappTemplateCtrl = asyncHandler(async (_req, res) => {
  const data = await getFdcFaqInquiryWhatsappTemplate()
  res.status(200).json({ ok: true, message: data.message, updatedAt: data.updatedAt })
})

export const putFdcFaqInquiryWhatsappTemplateCtrl = asyncHandler(async (req, res) => {
  const body = req.body || {}
  const data = await saveFdcFaqInquiryWhatsappTemplate({
    message: body.message,
    expectedUpdatedAt: body.expectedUpdatedAt,
    forceOverwrite: Boolean(body.forceOverwrite),
  })
  res.status(200).json({ ok: true, message: data.message, updatedAt: data.updatedAt })
})
