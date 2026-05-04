import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import {
  getOfertaAcademicaCtrl,
  putOfertaAcademicaCtrl,
} from '../controllers/ofertaAcademica.controller.js'

const router = Router()

router.get('/', getOfertaAcademicaCtrl)
router.put('/', authenticate, requireStaff, putOfertaAcademicaCtrl)

export default router
