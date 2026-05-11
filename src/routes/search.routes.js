import { Router } from 'express'
import { searchPublicCtrl } from '../controllers/search.controller.js'

const router = Router()

router.get('/', searchPublicCtrl)

export default router
