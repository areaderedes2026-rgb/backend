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
import {
  deleteAdminAreaOffice,
  getPublicAreaOffice,
  listAdminAreaOffices,
  listPublicAreaOffices,
  postAdminAreaOffice,
  putAdminAreaOffice,
} from '../controllers/areaOffice.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

const slugValidator = [param('slug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), validate]

const officeSlugValidator = [
  param('officeSlug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  validate,
]

router.get('/', listAreas)
router.get('/admin/list', authenticate, requireStaff, listAreasAdmin)
router.get('/page-content', getAreasPageContentCtrl)
router.put('/page-content', authenticate, requireStaff, putAreasPageContentCtrl)

router.get(
  '/:slug/offices/admin/list',
  authenticate,
  requireStaff,
  slugValidator,
  listAdminAreaOffices,
)
router.post(
  '/:slug/offices',
  authenticate,
  requireStaff,
  slugValidator,
  [
    body('name').trim().notEmpty().isLength({ max: 200 }),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('iconKey').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body('description').optional().isString().isLength({ max: 20000 }),
    body('activities').optional().isArray({ max: 80 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    validate,
  ],
  postAdminAreaOffice,
)
router.put(
  '/:slug/offices/id/:id',
  authenticate,
  requireStaff,
  slugValidator,
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('iconKey').optional({ checkFalsy: true }).trim().isLength({ max: 40 }),
    body('description').optional().isString().isLength({ max: 20000 }),
    body('activities').optional().isArray({ max: 80 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    validate,
  ],
  putAdminAreaOffice,
)
router.delete(
  '/:slug/offices/id/:id',
  authenticate,
  requireStaff,
  slugValidator,
  [param('id').isInt({ min: 1 }), validate],
  deleteAdminAreaOffice,
)

router.get('/:slug/offices', slugValidator, listPublicAreaOffices)
router.get('/:slug/offices/:officeSlug', slugValidator, officeSlugValidator, getPublicAreaOffice)

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
