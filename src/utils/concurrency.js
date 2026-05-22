import { AppError } from './AppError.js'

function toMs(value) {
  if (!value) return null
  const n = new Date(value).getTime()
  return Number.isFinite(n) ? n : null
}

export function assertOptimisticLock(
  expectedUpdatedAt,
  currentUpdatedAt,
  label = 'registro',
  forceOverwrite = false,
) {
  if (forceOverwrite) return
  const expectedMs = toMs(expectedUpdatedAt)
  const currentMs = toMs(currentUpdatedAt)
  if (expectedMs == null || currentMs == null) return
  if (expectedMs !== currentMs) {
    throw new AppError(
      `Otro usuario modificó este ${label} antes de que guardaras. Recargá la sección para continuar.`,
      409,
      { code: 'CONFLICT_STALE_WRITE', currentUpdatedAt },
    )
  }
}
