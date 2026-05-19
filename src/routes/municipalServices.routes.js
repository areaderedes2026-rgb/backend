import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  deleteMunicipalServiceCtrl,
  getServicesPageContentCtrl,
  listMunicipalServicesAdminCtrl,
  listMunicipalServicesPublicCtrl,
  postMunicipalServiceCtrl,
  putMunicipalServiceCtrl,
  putServicesPageContentCtrl,
} from '../controllers/municipalServices.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.get('/content', getServicesPageContentCtrl)
router.put('/content', authenticate, requireStaff, putServicesPageContentCtrl)

router.get('/items', listMunicipalServicesPublicCtrl)
router.get('/admin/items', authenticate, requireStaff, listMunicipalServicesAdminCtrl)

router.post(
  '/items',
  authenticate,
  requireStaff,
  [
    body('title').trim().notEmpty().isLength({ max: 180 }),
    body('summary').trim().notEmpty(),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body('mode').optional({ checkFalsy: true }).trim().isLength({ max: 140 }),
    body('eta').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    body('linkHref').optional({ checkFalsy: true }).trim().isLength({ max: 2048 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  postMunicipalServiceCtrl,
)

router.put(
  '/items/id/:id',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('title').optional().trim().notEmpty().isLength({ max: 180 }),
    body('summary').optional().trim().notEmpty(),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body('mode').optional({ checkFalsy: true }).trim().isLength({ max: 140 }),
    body('eta').optional({ checkFalsy: true }).trim().isLength({ max: 120 }),
    body('linkHref').optional({ checkFalsy: true }).trim().isLength({ max: 2048 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  putMunicipalServiceCtrl,
)

router.delete(
  '/items/id/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteMunicipalServiceCtrl,
)

export default router
