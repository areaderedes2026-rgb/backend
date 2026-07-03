import { Router } from 'express'
import { getHomeEmergency, putHomeEmergency } from '../controllers/homeEmergency.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/', getHomeEmergency)
router.put('/', authenticate, requireStaff, putHomeEmergency)

export default router
