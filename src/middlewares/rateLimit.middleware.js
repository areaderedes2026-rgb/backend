const buckets = new Map()

function nowMs() {
  return Date.now()
}

function clientKey(req) {
  const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown')
  return `${ip}:${req.path}`
}

export function createRateLimiter({
  windowMs = 60_000,
  max = 20,
  message = 'Demasiadas solicitudes. Intentá nuevamente en unos minutos.',
} = {}) {
  const safeWindow = Math.max(1_000, Number(windowMs) || 60_000)
  const safeMax = Math.max(1, Number(max) || 20)

  return function rateLimiter(req, res, next) {
    const key = clientKey(req)
    const current = buckets.get(key)
    const now = nowMs()

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + safeWindow })
      next()
      return
    }

    current.count += 1
    if (current.count > safeMax) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(Math.max(1, retryAfter)))
      res.status(429).json({
        ok: false,
        error: message,
      })
      return
    }

    next()
  }
}
