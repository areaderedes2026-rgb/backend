import { Router } from 'express'
import { body, param, query } from 'express-validator'
import {
  listUsers,
  getUser,
  postUser,
  putUser,
  deleteUser,
} from '../controllers/user.controller.js'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.use(authenticate, requireAdmin)

router.get(
  '/',
  [
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('offset').optional().isInt({ min: 0 }),
    validate,
  ],
  listUsers,
)

router.get('/:id', [param('id').isInt({ min: 1 }), validate], getUser)

router.post(
  '/',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 32 })
      .matches(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/)
      .withMessage('Nombre de usuario inválido.'),
    body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres.'),
    body('fullName').optional().trim().isLength({ max: 150 }),
    body('role').optional().isIn(['admin', 'editor', 'area_service_editor']),
    body('isActive').optional().isBoolean(),
    body('permissions').optional().isArray({ max: 30 }),
    body('permissions.*.resourceType').optional().isIn(['area_service']),
    body('permissions.*.areaSlug').optional().trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    body('permissions.*.resourceId').optional().trim().isLength({ min: 1, max: 120 }),
    body('permissions.*.canUpdate').optional().isBoolean(),
    validate,
  ],
  postUser,
)

router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 32 })
      .matches(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/)
      .withMessage('Nombre de usuario inválido.'),
    body('password').optional().isLength({ min: 6 }),
    body('fullName').optional().trim().isLength({ max: 150 }),
    body('role').optional().isIn(['admin', 'editor', 'area_service_editor']),
    body('isActive').optional().isBoolean(),
    body('permissions').optional().isArray({ max: 30 }),
    body('permissions.*.resourceType').optional().isIn(['area_service']),
    body('permissions.*.areaSlug').optional().trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    body('permissions.*.resourceId').optional().trim().isLength({ min: 1, max: 120 }),
    body('permissions.*.canUpdate').optional().isBoolean(),
    validate,
  ],
  putUser,
)

router.delete('/:id', [param('id').isInt({ min: 1 }), validate], deleteUser)

export default router
