import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import {
  getConcejoDeliberanteCtrl,
  putConcejoDeliberanteCtrl,
} from '../controllers/concejoDeliberante.controller.js'

const router = Router()

router.get('/', getConcejoDeliberanteCtrl)
router.put('/', authenticate, requireStaff, putConcejoDeliberanteCtrl)

export default router
