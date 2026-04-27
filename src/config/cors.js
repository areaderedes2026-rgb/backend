/**
 * Orígenes permitidos para el frontend.
 * CORS_ORIGIN puede ser comma-separated: http://localhost:5173,http://127.0.0.1:5173
 * Vacío o *: refleja el origen de la petición (útil en desarrollo).
 */
export function corsOriginOption() {
  const raw = (process.env.CORS_ORIGIN || '').trim()
  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production'
  if (!raw || raw === '*') {
    return isProd ? false : true
  }

  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return isProd ? false : true
  if (parts.length === 1) return parts[0]
  return parts
}
