import { Router } from 'express'
import { body, param } from 'express-validator'
import {
  listCategories,
  getCategory,
  postCategory,
  putCategory,
  deleteCategory,
} from '../controllers/category.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.get('/', listCategories)

router.get('/:id', [param('id').isInt({ min: 1 }), validate], getCategory)

router.post(
  '/',
  authenticate,
  requireStaff,
  [
    body('name').trim().notEmpty().isLength({ max: 120 }),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 130 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    validate,
  ],
  postCategory,
)

router.put(
  '/:id',
  authenticate,
  requireStaff,
  [
    param('id').isInt({ min: 1 }),
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('slug').optional({ checkFalsy: true }).trim().isLength({ max: 130 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    validate,
  ],
  putCategory,
)

router.delete(
  '/:id',
  authenticate,
  requireStaff,
  [param('id').isInt({ min: 1 }), validate],
  deleteCategory,
)

export default router
