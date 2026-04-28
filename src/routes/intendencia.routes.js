import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import {
  getIntendenciaCtrl,
  putIntendenciaCtrl,
} from '../controllers/intendencia.controller.js'

const router = Router()

router.get('/', getIntendenciaCtrl)
router.put('/', authenticate, requireStaff, putIntendenciaCtrl)

export default router
