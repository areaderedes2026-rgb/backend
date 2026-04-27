import { Router } from 'express'
import { getHomeMap, putHomeMap } from '../controllers/homeMap.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/', getHomeMap)
router.put('/', authenticate, requireStaff, putHomeMap)

export default router
