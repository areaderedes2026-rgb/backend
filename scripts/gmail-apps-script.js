/**
 * Pegá este código en script.google.com (cuenta areaderedes2026@gmail.com).
 * Luego: Implementar → Nueva implementación → Aplicación web
 *   - Ejecutar como: Yo
 *   - Quién tiene acceso: Cualquier persona
 * Copiá la URL de la app web a Railway como MAIL_APPSCRIPT_URL.
 *
 * Opcional: cambiá SECRET y poné el mismo valor en MAIL_APPSCRIPT_SECRET.
 */

const SECRET = 'trancas-fdc-2026'

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function doGet() {
  return jsonOut({ ok: true, service: 'trancas-fdc-mail' })
}

function doPost(e) {
  try {
    const raw = e?.postData?.contents || '{}'
    const data = JSON.parse(raw)

    if (SECRET && data.secret !== SECRET) {
      return jsonOut({ ok: false, error: 'unauthorized' })
    }

    const to = String(data.to || '').trim()
    const subject = String(data.subject || 'Municipalidad de Trancas').trim()
    const text = String(data.text || '')
    const html = data.html ? String(data.html) : ''
    const fromName = String(data.fromName || 'Municipalidad de Trancas').trim()

    if (!to) return jsonOut({ ok: false, error: 'missing to' })

    const options = { name: fromName }
    if (html) options.htmlBody = html

    GmailApp.sendEmail(to, subject, text || ' ', options)
    return jsonOut({ ok: true })
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) })
  }
}
