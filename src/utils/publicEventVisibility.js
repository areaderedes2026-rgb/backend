/** Un evento público se muestra el día del evento y todos los posteriores (no los ya pasados). */
function startOfLocalDay(ms) {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function isPublicEventStillVisible(eventDate, nowMs = Date.now()) {
  const t = new Date(eventDate).getTime()
  if (!Number.isFinite(t)) return false
  return startOfLocalDay(t) >= startOfLocalDay(nowMs)
}
