import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { getHistory, putHistory } from '../controllers/history.controller.js'

const router = Router()

router.get('/', getHistory)
router.put('/', authenticate, requireStaff, putHistory)

export default router
