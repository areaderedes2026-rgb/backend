import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  deleteTourismPlace,
  getTourismPlace,
  listTourismPlaces,
  listTourismPlacesAdminCtrl,
  postTourismPlace,
  putTourismPlace,
} from '../controllers/tourismPlace.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.get('/', listTourismPlaces)
router.get('/admin/list', authenticate, requireStaff, listTourismPlacesAdminCtrl)
router.get(
  '/:slug',
  [param('slug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), validate],
  getTourismPlace,
)

router.post(
  '/',
  authenticate,
  requireStaff,
  [
    body('name').trim().notEmpty().isLength({ max: 180 }),
    body('fullDescription').trim().notEmpty(),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body('imageUrl').optional({ checkFalsy: true }).trim().isLength({ max: 2048 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  postTourismPlace,
)

router.put(
  '/id/:id',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 180 }),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 90 }),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
    body('imageUrl').optional({ checkFalsy: true }).trim().isLength({ max: 2048 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    body('isActive').optional().isBoolean(),
    validate,
  ],
  putTourismPlace,
)

router.delete(
  '/id/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteTourismPlace,
)

export default router
