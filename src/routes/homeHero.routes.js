import { Router } from 'express'
import { getHomeHero, putHomeHero } from '../controllers/homeHero.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/', getHomeHero)
router.put('/', authenticate, requireStaff, putHomeHero)

export default router
