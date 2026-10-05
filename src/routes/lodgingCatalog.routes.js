import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import {
  getLodgingCatalogCtrl,
  putLodgingCatalogCtrl,
} from '../controllers/lodgingCatalog.controller.js'

const router = Router()

router.get('/', getLodgingCatalogCtrl)
router.put('/', authenticate, requireStaff, putLodgingCatalogCtrl)

export default router
