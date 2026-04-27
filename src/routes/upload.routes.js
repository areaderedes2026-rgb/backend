import { Router } from 'express'
import { body } from 'express-validator'
import {
  postImportNewsImageFromUrl,
  postUploadNewsImage,
} from '../controllers/upload.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { uploadNewsImage } from '../middlewares/upload.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()

router.post(
  '/',
  authenticate,
  requireStaff,
  (req, res, next) => {
    uploadNewsImage.single('file')(req, res, (err) => {
      if (err) {
        res.status(400).json({
          ok: false,
          error: err.message || 'Error al subir el archivo.',
        })
        return
      }
      next()
    })
  },
  postUploadNewsImage,
)

router.post(
  '/from-url',
  authenticate,
  requireStaff,
  [
    body('url').trim().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('kind').optional().isIn(['cover', 'gallery']),
    validate,
  ],
  postImportNewsImageFromUrl,
)

export default router
