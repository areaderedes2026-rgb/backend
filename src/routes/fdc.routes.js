import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  deleteFdcStallApplicationCtrl,
  getFdcContentAdminCtrl,
  getFdcContentCtrl,
  getFdcStallApplicationAdminCtrl,
  getFdcWhatsappTemplateCtrl,
  listFdcStallApplicationsAdminCtrl,
  patchFdcStallApplicationStatusCtrl,
  postFdcStallApplicationCtrl,
  putFdcContentCtrl,
  putFdcWhatsappTemplateCtrl,
  resendFdcStallEmailCtrl,
} from '../controllers/fdc.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { createRateLimiter } from '../middlewares/rateLimit.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { FDC_RUBROS } from '../services/fdc.service.js'

const router = Router()

const applicationRateLimit = createRateLimiter({
  windowMs: 10 * 60_000,
  max: 12,
  message:
    'Recibimos muchas preinscripciones desde este origen. Intentá nuevamente en unos minutos.',
})

router.get('/content', getFdcContentCtrl)

router.get('/admin/content', authenticate, requireStaff, getFdcContentAdminCtrl)

router.put('/content', authenticate, requireStaff, putFdcContentCtrl)

router.get(
  '/admin/whatsapp-message',
  authenticate,
  requireStaff,
  getFdcWhatsappTemplateCtrl,
)

router.put(
  '/admin/whatsapp-message',
  authenticate,
  requireStaff,
  [
    body('message').optional().isString().isLength({ max: 3500 }),
    body('expectedUpdatedAt').optional({ nullable: true }),
    validate,
  ],
  putFdcWhatsappTemplateCtrl,
)

router.post(
  '/stall-applications',
  applicationRateLimit,
  [
    body('fullName').trim().notEmpty().isLength({ max: 180 }),
    body('dni').trim().notEmpty().isLength({ max: 20 }),
    body('address').trim().notEmpty().isLength({ max: 320 }),
    body('locality').trim().notEmpty().isLength({ max: 160 }),
    body('phone').trim().notEmpty().isLength({ min: 6, max: 80 }),
    body('email').trim().notEmpty().isEmail().isLength({ max: 180 }),
    body('rubro').trim().notEmpty().isIn(FDC_RUBROS),
    body('rubroOther').optional({ checkFalsy: true }).trim().isLength({ max: 180 }),
    body('participatedBefore').optional().isBoolean(),
    body('participationYears').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    body('dniCopyAck').isBoolean().custom((v) => v === true),
    body('acceptedNotice').isBoolean().custom((v) => v === true),
    validate,
  ],
  postFdcStallApplicationCtrl,
)

router.get(
  '/admin/stall-applications',
  authenticate,
  requireStaff,
  [
    query('status')
      .optional({ checkFalsy: true })
      .trim()
      .isIn(['sin_resolver', 'leida', 'resuelta']),
    validate,
  ],
  listFdcStallApplicationsAdminCtrl,
)

router.get(
  '/admin/stall-applications/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  getFdcStallApplicationAdminCtrl,
)

router.patch(
  '/admin/stall-applications/:id/status',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('status').trim().isIn(['sin_resolver', 'leida', 'resuelta']),
    validate,
  ],
  patchFdcStallApplicationStatusCtrl,
)

router.post(
  '/admin/stall-applications/:id/resend-email',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  resendFdcStallEmailCtrl,
)

router.delete(
  '/admin/stall-applications/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteFdcStallApplicationCtrl,
)

export default router
