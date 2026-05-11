/** Tiempo tras el cual un evento deja de exponerse en la API pública (debe coincidir con el frontend). */
export const PUBLIC_EVENT_RETENTION_MS = 5 * 24 * 60 * 60 * 1000

export function isPublicEventStillVisible(eventDate, nowMs = Date.now()) {
  const t = new Date(eventDate).getTime()
  if (!Number.isFinite(t)) return false
  return nowMs - t < PUBLIC_EVENT_RETENTION_MS
}
