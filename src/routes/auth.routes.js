import { Router } from 'express'
import { body } from 'express-validator'
import { postLogin, getMe } from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import { createRateLimiter } from '../middlewares/rateLimit.middleware.js'
import { validate } from '../middlewares/validate.middleware.js'

const router = Router()
const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60_000,
  max: 15,
  message: 'Demasiados intentos de acceso. Esperá unos minutos antes de reintentar.',
})

router.post(
  '/login',
  loginRateLimit,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 32 })
      .withMessage('El usuario debe tener entre 3 y 32 caracteres.')
      .matches(/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/)
      .withMessage('Usuario inválido (solo letras, números, punto, guión y guión bajo).'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
    validate,
  ],
  postLogin,
)

router.get('/me', authenticate, getMe)

export default router
