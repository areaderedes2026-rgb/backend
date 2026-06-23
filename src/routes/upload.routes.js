import { Router } from 'express'
import { body } from 'express-validator'
import multer from 'multer'
import {
  postImportNewsImageFromUrl,
  postUploadNewsImage,
  postUploadPdf,
} from '../controllers/upload.controller.js'
import { authenticate, requireImageUpload } from '../middlewares/auth.middleware.js'
import { uploadNewsImage, uploadPdfDocument } from '../middlewares/upload.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'
import { CLOUDINARY_IMPORT_MAX_BYTES } from '../config/cloudinary.js'

const router = Router()

router.post(
  '/',
  authenticate,
  requireImageUpload,
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
  '/pdf',
  authenticate,
  requireImageUpload,
  (req, res, next) => {
    uploadPdfDocument.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          const maxMb = Math.round((CLOUDINARY_IMPORT_MAX_BYTES / (1024 * 1024)) * 10) / 10
          res.status(400).json({
            ok: false,
            error: `El PDF excede el tamaño permitido (${maxMb} MB).`,
          })
          return
        }
        res.status(400).json({
          ok: false,
          error: err.message || 'Error al subir el PDF.',
        })
        return
      }
      next()
    })
  },
  postUploadPdf,
)

router.post(
  '/from-url',
  authenticate,
  requireImageUpload,
  [
    body('url').trim().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('kind').optional().isIn(['cover', 'gallery']),
    validate,
  ],
  postImportNewsImageFromUrl,
)

export default router
