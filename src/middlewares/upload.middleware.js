import multer from 'multer'
import { CLOUDINARY_IMPORT_MAX_BYTES } from '../config/cloudinary.js'

export const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const ALLOWED_PDF_MIME = new Set(['application/pdf'])

export const uploadNewsImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CLOUDINARY_IMPORT_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF).'))
  },
})

export const uploadPdfDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CLOUDINARY_IMPORT_MAX_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_PDF_MIME.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error('Solo se permiten archivos PDF.'))
  },
})
