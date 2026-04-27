import { AppError } from '../utils/AppError.js'

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err)
    return
  }

  const status = err instanceof AppError ? err.statusCode : err.statusCode || 500
  const message =
    err instanceof AppError
      ? err.message
      : status === 500
        ? 'Error interno del servidor.'
        : err.message || 'Error'

  const body = {
    ok: false,
    error: message,
  }
  if (err instanceof AppError && err.details) {
    body.details = err.details
  }
  if (process.env.NODE_ENV !== 'production' && status === 500 && err.stack) {
    body.stack = err.stack
  }

  // Loguea errores del servidor para diagnóstico en hosting (Railway, etc.).
  if (status >= 500) {
    const where = `${req.method} ${req.originalUrl}`
    const reason = err?.code ? `${err.code}: ${err.message}` : err?.message || 'Unknown error'
    console.error(`[API 500] ${where} -> ${reason}`)
    if (err?.stack) console.error(err.stack)
  }

  res.status(status).json(body)
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    ok: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  })
}
