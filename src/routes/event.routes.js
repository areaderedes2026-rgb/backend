import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  deleteEventCtrl,
  listEventsAdminCtrl,
  listEventsCtrl,
  postEventCtrl,
  putEventCtrl,
} from '../controllers/event.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.get('/', listEventsCtrl)
router.get('/admin', authenticate, requireStaff, listEventsAdminCtrl)

router.post(
  '/',
  authenticate,
  requireStaff,
  [
    body('title').trim().notEmpty().isLength({ max: 180 }),
    body('place').trim().notEmpty().isLength({ max: 180 }),
    body('flyerUrl').trim().notEmpty().isLength({ max: 2048 }),
    body('summary').optional().trim().isLength({ max: 1000 }),
    body('slug').optional().trim().isLength({ max: 220 }),
    body('eventDate').notEmpty().isISO8601(),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  postEventCtrl,
)

router.put(
  '/:id',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('title').trim().notEmpty().isLength({ max: 180 }),
    body('place').trim().notEmpty().isLength({ max: 180 }),
    body('flyerUrl').trim().notEmpty().isLength({ max: 2048 }),
    body('summary').optional().trim().isLength({ max: 1000 }),
    body('slug').optional().trim().isLength({ max: 220 }),
    body('eventDate').notEmpty().isISO8601(),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  putEventCtrl,
)

router.delete(
  '/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteEventCtrl,
)

export default router
