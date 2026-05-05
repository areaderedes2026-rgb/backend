import { Router } from 'express'
import { body } from 'express-validator'
import multer from 'multer'
import {
  postImportNewsImageFromUrl,
  postUploadNewsImage,
} from '../controllers/upload.controller.js'
import { authenticate, requireStaff } from '../middlewares/auth.middleware.js'
import { uploadNewsImage } from '../middlewares/upload.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { CLOUDINARY_IMPORT_MAX_BYTES } from '../config/cloudinary.js'

const router = Router()

router.post(
  '/',
  authenticate,
  requireStaff,
  (req, res, next) => {
    uploadNewsImage.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          const maxMb = Math.round((CLOUDINARY_IMPORT_MAX_BYTES / (1024 * 1024)) * 10) / 10
          res.status(400).json({
            ok: false,
            error: `La imagen excede el tamaño permitido (${maxMb} MB).`,
          })
          return
        }
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
