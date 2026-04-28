import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  listNews,
  getNews,
  postNews,
  putNews,
  deleteNews,
  postNewsInteraction,
  getNewsStats,
} from '../controllers/news.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.get('/', listNews)

router.get('/stats/overview', authenticate, requireStaff, getNewsStats)

router.get(
  '/:idOrSlug',
  [param('idOrSlug').trim().notEmpty().isLength({ max: 300 }), validate],
  getNews,
)

router.post(
  '/',
  authenticate,
  requireStaff,
  [
    body('title').trim().notEmpty().isLength({ max: 500 }),
    body('summary').trim().notEmpty(),
    body('body').trim().notEmpty(),
    body('slug').optional().trim().isLength({ max: 220 }),
    body('categoryId').optional().isInt({ min: 1 }),
    body('imageUrl').optional({ nullable: true }),
    body('galleryUrls').optional().isArray({ max: 20 }),
    body('galleryUrls.*').optional().isString().isLength({ max: 2048 }),
    body('publishedAt').optional().isISO8601(),
    validate,
  ],
  postNews,
)

router.post(
  '/:idOrSlug/interactions',
  [
    param('idOrSlug').trim().notEmpty().isLength({ max: 300 }),
    body('type').isIn(['view', 'share']),
    body('channel')
      .optional({ nullable: true })
      .isIn(['facebook', 'whatsapp', 'instagram', 'native', 'copy_link']),
    validate,
  ],
  postNewsInteraction,
)

router.put(
  '/:id',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('title').optional().trim().notEmpty().isLength({ max: 500 }),
    body('summary').optional().trim(),
    body('body').optional().trim(),
    body('slug').optional().trim().isLength({ max: 220 }),
    body('categoryId').optional().isInt({ min: 1 }),
    body('imageUrl').optional({ nullable: true }),
    body('galleryUrls').optional().isArray({ max: 20 }),
    body('galleryUrls.*').optional().isString().isLength({ max: 2048 }),
    body('publishedAt').optional().isISO8601(),
    validate,
  ],
  putNews,
)

router.delete(
  '/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteNews,
)

export default router
