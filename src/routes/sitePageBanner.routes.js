import { Router } from 'express'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import {
  getSitePageBannerCtrl,
  putSitePageBannerCtrl,
} from '../controllers/sitePageBanner.controller.js'

const router = Router()

router.get('/:pageKey', getSitePageBannerCtrl)
router.put('/:pageKey', authenticate, requireStaff, putSitePageBannerCtrl)

export default router
