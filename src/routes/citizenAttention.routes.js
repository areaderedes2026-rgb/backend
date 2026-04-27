import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  deleteCitizenInquiryCtrl,
  getCitizenAttentionContentCtrl,
  getCitizenInquiryAdminCtrl,
  listCitizenInquiriesAdminCtrl,
  patchCitizenInquiryStatusCtrl,
  postCitizenInquiryCtrl,
  putCitizenAttentionContentCtrl,
} from '../controllers/citizenAttention.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { createRateLimiter } from '../middlewares/rateLimit.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()
const inquiryRateLimit = createRateLimiter({
  windowMs: 10 * 60_000,
  max: 20,
  message: 'Recibimos muchas consultas desde este origen. Intentá nuevamente en unos minutos.',
})

router.get('/content', getCitizenAttentionContentCtrl)

router.put('/content', authenticate, requireStaff, putCitizenAttentionContentCtrl)

router.post(
  '/inquiries',
  inquiryRateLimit,
  [
    body('firstName').trim().notEmpty().isLength({ max: 120 }),
    body('lastName').trim().notEmpty().isLength({ max: 120 }),
    body('dni').trim().notEmpty().isLength({ max: 20 }),
    body('email').optional({ checkFalsy: true }).trim().isEmail().isLength({ max: 180 }),
    body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body('topic').trim().notEmpty().isLength({ max: 40 }),
    body('message').trim().notEmpty().isLength({ min: 12, max: 5000 }),
    validate,
  ],
  postCitizenInquiryCtrl,
)

router.get(
  '/admin/inquiries',
  authenticate,
  requireStaff,
  [
    query('status')
      .optional({ checkFalsy: true })
      .trim()
      .isIn(['sin_resolver', 'leida', 'resuelta']),
    validate,
  ],
  listCitizenInquiriesAdminCtrl,
)

router.get(
  '/admin/inquiries/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  getCitizenInquiryAdminCtrl,
)

router.patch(
  '/admin/inquiries/:id/status',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('status').trim().isIn(['sin_resolver', 'leida', 'resuelta']),
    validate,
  ],
  patchCitizenInquiryStatusCtrl,
)

router.delete(
  '/admin/inquiries/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteCitizenInquiryCtrl,
)

export default router
