import { Router } from 'express'
import { param } from 'express-validator'
import {
  getAreaProfileBySlug,
  putAreaProfileBySlug,
} from '../controllers/areaProfile.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

const slugValidator = [param('slug').trim().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), validate]

router.get('/:slug/profile', slugValidator, getAreaProfileBySlug)

router.put(
  '/:slug/profile',
  authenticate,
  requireStaff,
  slugValidator,
  putAreaProfileBySlug,
)

export default router
