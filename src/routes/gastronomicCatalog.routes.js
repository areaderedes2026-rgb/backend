import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import {
  getGastronomicCatalogCtrl,
  putGastronomicCatalogCtrl,
} from '../controllers/gastronomicCatalog.controller.js'

const router = Router()

router.get('/', getGastronomicCatalogCtrl)
router.put('/', authenticate, requireStaff, putGastronomicCatalogCtrl)

export default router
