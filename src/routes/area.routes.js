import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  listAreas,
  getArea,
  listAreasAdmin,
  postArea,
  putArea,
  deleteArea,
} from '../controllers/area.controller.js'
import {
  getAreaProfileBySlug,
  putAreaProfileBySlug,
} from '../controllers/areaProfile.controller.js'
import {
  getAreasPageContentCtrl,
  putAreasPageContentCtrl,
} from '../controllers/areasPage.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

const slugValidator = [param('slug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), validate]

router.get('/', listAreas)
router.get('/admin/list', authenticate, requireStaff, listAreasAdmin)
router.get('/page-content', getAreasPageContentCtrl)
router.put('/page-content', authenticate, requireStaff, putAreasPageContentCtrl)

router.get('/:slug/profile', slugValidator, getAreaProfileBySlug)
router.put(
  '/:slug/profile',
  authenticate,
  requireStaff,
  slugValidator,
  putAreaProfileBySlug,
)

router.get('/:slug', slugValidator, getArea)

router.post(
  '/',
  authenticate,
  requireStaff,
  [
    body('title').trim().notEmpty().isLength({ max: 160 }),
    body('description').trim().notEmpty(),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('coverImage').optional({ checkFalsy: true }).trim().isLength({ max: 2048 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    validate,
  ],
  postArea,
)

router.put(
  '/id/:id',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('title').optional().trim().notEmpty().isLength({ max: 160 }),
    body('description').optional().trim().notEmpty(),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('coverImage').optional({ checkFalsy: true }).trim().isLength({ max: 2048 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  putArea,
)

router.delete(
  '/id/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteArea,
)

export default router
