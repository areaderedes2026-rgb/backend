import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import {
  getLegisladorEsteCtrl,
  putLegisladorEsteCtrl,
} from '../controllers/legisladorEste.controller.js'

const router = Router()

router.get('/', getLegisladorEsteCtrl)
router.put('/', authenticate, requireStaff, putLegisladorEsteCtrl)

export default router
