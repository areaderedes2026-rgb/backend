import { validationResult } from 'express-validator'
import { AppError } from '../utils/AppError.js'

export function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    next(
      new AppError('Datos inválidos.', 422, errors.array({ onlyFirstError: true })),
    )
    return
  }
  next()
}
