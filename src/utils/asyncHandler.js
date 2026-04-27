/**
 * Envuelve funciones async de Express para delegar errores al middleware global.
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
