import { pool } from '../config/db.js'

/** Clave comparable de teléfono AR (últimos 10 dígitos). */
export function normalizePhoneKey(phone) {
  let d = String(phone ?? '').replace(/\D/g, '')
  if (!d) return ''
  d = d.replace(/^0+/, '')
  if (d.startsWith('549') && d.length >= 12) d = d.slice(3)
  else if (d.startsWith('54') && d.length >= 11) d = d.slice(2)
  if (d.length === 11 && d.startsWith('9')) d = d.slice(1)
  if (d.length > 10) d = d.slice(-10)
  return d
}

function parseJsonSafe(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function toDateYmd(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function mapPageRow(row) {
  if (!row) return null
  const useful = parseJsonSafe(row.useful_info_json, {}) || {}
  const rubrosFromUseful = Array.isArray(useful.formRubros) ? useful.formRubros : null
  const rubrosFromCol =
    row.form_rubros_json != null ? parseJsonSafe(row.form_rubros_json, null) : null
  // Preferimos useful_info (se escribe siempre en el upsert) si trae rubros.
  const formRubros =
    rubrosFromUseful && rubrosFromUseful.length > 0
      ? rubrosFromUseful
      : rubrosFromCol && Array.isArray(rubrosFromCol) && rubrosFromCol.length > 0
        ? rubrosFromCol
        : null
  const formEyebrow =
    (useful.formEyebrow != null && String(useful.formEyebrow).trim() !== ''
      ? String(useful.formEyebrow)
      : '') ||
    row.form_eyebrow ||
    ''
  const formHeading =
    (useful.formHeading != null && String(useful.formHeading).trim() !== ''
      ? String(useful.formHeading)
      : '') ||
    row.form_heading ||
    ''

  return {
    heroEyebrow: row.hero_eyebrow || '',
    heroTitle: row.hero_title || '',
    heroSubtitle: row.hero_subtitle || '',
    heroSlogan: row.hero_slogan || '',
    heroDateBadge: row.hero_date_badge || '',
    heroImageUrl: row.hero_image_url || '',
    overlayOpacity: Number.isFinite(Number(row.hero_overlay_opacity))
      ? Math.min(90, Math.max(0, Math.round(Number(row.hero_overlay_opacity))))
      : 65,
    heroPrimaryLabel: row.hero_primary_label || '',
    heroPrimaryHref: row.hero_primary_href || '',
    heroSecondaryLabel: row.hero_secondary_label || '',
    heroSecondaryHref: row.hero_secondary_href || '',
    heroSearchPlaceholder: row.hero_search_placeholder || '',
    showHeroBadge: row.show_hero_badge !== 0,
    showHeroTitle: row.show_hero_title !== 0,
    showHeroSubtitle: row.show_hero_subtitle !== 0,
    showSearch: row.show_search !== 0,
    showPrimaryButton: row.show_primary_button !== 0,
    showSecondaryButton: row.show_secondary_button !== 0,
    introTitle: row.intro_title || '',
    introParagraphs: parseJsonSafe(row.intro_paragraphs_json, []),
    highlights: parseJsonSafe(row.highlights_json, []),
    sectionNav: parseJsonSafe(row.section_nav_json, []),
    schedule: parseJsonSafe(row.schedule_json, null),
    artists: parseJsonSafe(row.artists_json, null),
    tickets: parseJsonSafe(row.tickets_json, null),
    news: parseJsonSafe(row.news_json, null),
    gallery: parseJsonSafe(row.gallery_json, null),
    sponsors: parseJsonSafe(row.sponsors_json, null),
    festivalStats: parseJsonSafe(row.festival_stats_json, null),
    usefulInfo: useful,
    formNotice: row.form_notice || '',
    formOpenFrom: toDateYmd(row.form_open_from),
    formOpenUntil: toDateYmd(row.form_open_until),
    formRubros,
    formEyebrow,
    formHeading,
    heroImageUrlMobile:
      useful.heroImageUrlMobile != null && String(useful.heroImageUrlMobile).trim() !== ''
        ? String(useful.heroImageUrlMobile).trim()
        : '',
    heroCountdown:
      useful.heroCountdown && typeof useful.heroCountdown === 'object'
        ? useful.heroCountdown
        : {
            enabled: false,
            targetAt: '',
            offsetYMobile: 0,
            offsetYDesktop: 0,
            labelColor: '#ffffff',
          },
    ctaTitle: row.cta_title || '',
    ctaBody: row.cta_body || '',
    whatsappMessage: row.whatsapp_message != null ? String(row.whatsapp_message) : '',
    updatedAt: row.updated_at || null,
  }
}

function mapApplicationRow(row) {
  if (!row) return null
  return {
    id: row.id,
    fullName: row.full_name || '',
    dni: row.dni || '',
    address: row.address || '',
    locality: row.locality || '',
    phone: row.phone || '',
    email: row.email || '',
    rubro: row.rubro || '',
    rubroOther: row.rubro_other || '',
    participatedBefore: Boolean(row.participated_before),
    participationYears: row.participation_years || '',
    dniCopyAck: Boolean(row.dni_copy_ack),
    acceptedNotice: Boolean(row.accepted_notice),
    status: row.status || 'sin_resolver',
    emailSentAt: row.email_sent_at || null,
    emailError: row.email_error || '',
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }
}

export async function getFdcPageContentRow() {
  const [rows] = await pool.query('SELECT * FROM fdc_page_content WHERE id = 1 LIMIT 1')
  return mapPageRow(rows[0] ?? null)
}

export async function upsertFdcPageContentRow(payload) {
  await pool.query(
    `INSERT INTO fdc_page_content (
      id,
      hero_eyebrow,
      hero_title,
      hero_subtitle,
      hero_slogan,
      hero_date_badge,
      hero_image_url,
      hero_overlay_opacity,
      hero_primary_label,
      hero_primary_href,
      hero_secondary_label,
      hero_secondary_href,
      hero_search_placeholder,
      show_hero_badge,
      show_hero_title,
      show_hero_subtitle,
      show_search,
      show_primary_button,
      show_secondary_button,
      intro_title,
      intro_paragraphs_json,
      highlights_json,
      section_nav_json,
      schedule_json,
      artists_json,
      tickets_json,
      news_json,
      gallery_json,
      sponsors_json,
      festival_stats_json,
      useful_info_json,
      form_notice,
      form_rubros_json,
      form_eyebrow,
      form_heading,
      form_open_from,
      form_open_until,
      cta_title,
      cta_body,
      whatsapp_message
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      hero_eyebrow = VALUES(hero_eyebrow),
      hero_title = VALUES(hero_title),
      hero_subtitle = VALUES(hero_subtitle),
      hero_slogan = VALUES(hero_slogan),
      hero_date_badge = VALUES(hero_date_badge),
      hero_image_url = VALUES(hero_image_url),
      hero_overlay_opacity = VALUES(hero_overlay_opacity),
      hero_primary_label = VALUES(hero_primary_label),
      hero_primary_href = VALUES(hero_primary_href),
      hero_secondary_label = VALUES(hero_secondary_label),
      hero_secondary_href = VALUES(hero_secondary_href),
      hero_search_placeholder = VALUES(hero_search_placeholder),
      show_hero_badge = VALUES(show_hero_badge),
      show_hero_title = VALUES(show_hero_title),
      show_hero_subtitle = VALUES(show_hero_subtitle),
      show_search = VALUES(show_search),
      show_primary_button = VALUES(show_primary_button),
      show_secondary_button = VALUES(show_secondary_button),
      intro_title = VALUES(intro_title),
      intro_paragraphs_json = VALUES(intro_paragraphs_json),
      highlights_json = VALUES(highlights_json),
      section_nav_json = VALUES(section_nav_json),
      schedule_json = VALUES(schedule_json),
      artists_json = VALUES(artists_json),
      tickets_json = VALUES(tickets_json),
      news_json = VALUES(news_json),
      gallery_json = VALUES(gallery_json),
      sponsors_json = VALUES(sponsors_json),
      festival_stats_json = VALUES(festival_stats_json),
      useful_info_json = VALUES(useful_info_json),
      form_notice = VALUES(form_notice),
      form_rubros_json = VALUES(form_rubros_json),
      form_eyebrow = VALUES(form_eyebrow),
      form_heading = VALUES(form_heading),
      form_open_from = VALUES(form_open_from),
      form_open_until = VALUES(form_open_until),
      cta_title = VALUES(cta_title),
      cta_body = VALUES(cta_body),
      whatsapp_message = VALUES(whatsapp_message),
      updated_at = CURRENT_TIMESTAMP(3)`,
    [
      payload.heroEyebrow,
      payload.heroTitle,
      payload.heroSubtitle,
      payload.heroSlogan || '',
      payload.heroDateBadge || '',
      payload.heroImageUrl,
      Math.min(
        90,
        Math.max(
          0,
          Math.round(
            Number.isFinite(Number(payload.overlayOpacity)) ? Number(payload.overlayOpacity) : 65,
          ),
        ),
      ),
      payload.heroPrimaryLabel,
      payload.heroPrimaryHref,
      payload.heroSecondaryLabel,
      payload.heroSecondaryHref,
      payload.heroSearchPlaceholder,
      payload.showHeroBadge !== false ? 1 : 0,
      payload.showHeroTitle !== false ? 1 : 0,
      payload.showHeroSubtitle !== false ? 1 : 0,
      payload.showSearch === true ? 1 : 0,
      payload.showPrimaryButton === true ? 1 : 0,
      payload.showSecondaryButton === true ? 1 : 0,
      payload.introTitle,
      JSON.stringify(payload.introParagraphs || []),
      JSON.stringify(payload.highlights || []),
      JSON.stringify(payload.sectionNav || []),
      JSON.stringify(payload.schedule || {}),
      JSON.stringify(payload.artists || {}),
      JSON.stringify(payload.tickets || {}),
      JSON.stringify(payload.news || {}),
      JSON.stringify(payload.gallery || {}),
      JSON.stringify(payload.sponsors || {}),
      JSON.stringify(payload.festivalStats || {}),
      JSON.stringify(payload.usefulInfo || {}),
      payload.formNotice,
      JSON.stringify(Array.isArray(payload.formRubros) ? payload.formRubros : []),
      payload.formEyebrow || '',
      payload.formHeading || '',
      payload.formOpenFrom || null,
      payload.formOpenUntil || null,
      payload.ctaTitle,
      payload.ctaBody,
      payload.whatsappMessage == null || payload.whatsappMessage === ''
        ? null
        : payload.whatsappMessage,
    ],
  )
  return getFdcPageContentRow()
}

export async function updateFdcWhatsappMessageRow(message) {
  await pool.query(
    `UPDATE fdc_page_content
     SET whatsapp_message = ?, updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = 1`,
    [message == null || message === '' ? null : message],
  )
  return getFdcPageContentRow()
}

export async function createFdcStallApplicationRow(payload) {
  const [result] = await pool.query(
    `INSERT INTO fdc_stall_applications (
      full_name,
      dni,
      address,
      locality,
      phone,
      email,
      rubro,
      rubro_other,
      participated_before,
      participation_years,
      dni_copy_ack,
      accepted_notice,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.fullName,
      payload.dni,
      payload.address,
      payload.locality,
      payload.phone,
      payload.email,
      payload.rubro,
      payload.rubroOther,
      payload.participatedBefore ? 1 : 0,
      payload.participationYears,
      payload.dniCopyAck ? 1 : 0,
      payload.acceptedNotice ? 1 : 0,
      payload.status || 'sin_resolver',
    ],
  )
  return findFdcStallApplicationById(result.insertId)
}

export async function findFdcStallApplicationById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM fdc_stall_applications WHERE id = ? LIMIT 1',
    [id],
  )
  return mapApplicationRow(rows[0] ?? null)
}

/**
 * Busca preinscripción previa por email o teléfono (evita duplicados).
 * @returns {{ field: 'email' | 'phone', application: object } | null}
 */
export async function findFdcStallDuplicateByContact({ email, phone }) {
  const emailNorm = String(email || '').trim().toLowerCase()
  if (emailNorm) {
    const [byEmail] = await pool.query(
      `SELECT * FROM fdc_stall_applications
       WHERE LOWER(TRIM(email)) = ?
       ORDER BY id ASC
       LIMIT 1`,
      [emailNorm],
    )
    if (byEmail[0]) {
      return { field: 'email', application: mapApplicationRow(byEmail[0]) }
    }
  }

  const phoneKey = normalizePhoneKey(phone)
  if (phoneKey && phoneKey.length >= 8) {
    // Prefiltro SQL por últimos dígitos; la comparación exacta se hace con normalizePhoneKey.
    const [rows] = await pool.query(
      `SELECT * FROM fdc_stall_applications
       WHERE phone IS NOT NULL
         AND TRIM(phone) != ''
         AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?
       ORDER BY id ASC
       LIMIT 40`,
      [`%${phoneKey}`],
    )
    for (const row of rows) {
      if (normalizePhoneKey(row.phone) === phoneKey) {
        return { field: 'phone', application: mapApplicationRow(row) }
      }
    }
  }

  return null
}

export async function listFdcStallApplications({ status = '' } = {}) {
  const value = String(status || '').trim().toLowerCase()
  const params = []
  let where = ''
  if (value && ['sin_resolver', 'leida', 'resuelta'].includes(value)) {
    where = 'WHERE status = ?'
    params.push(value)
  }
  const [rows] = await pool.query(
    `SELECT * FROM fdc_stall_applications
     ${where}
     ORDER BY created_at DESC, id DESC`,
    params,
  )
  return rows.map(mapApplicationRow)
}

export async function updateFdcStallApplicationStatusRow(id, status) {
  await pool.query(
    `UPDATE fdc_stall_applications
     SET status = ?, updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`,
    [status, id],
  )
  return findFdcStallApplicationById(id)
}

export async function updateFdcStallApplicationEmailMeta(id, { emailSentAt = null, emailError = '' } = {}) {
  await pool.query(
    `UPDATE fdc_stall_applications
     SET email_sent_at = ?, email_error = ?, updated_at = CURRENT_TIMESTAMP(3)
     WHERE id = ?`,
    [emailSentAt, String(emailError || '').slice(0, 500), id],
  )
  return findFdcStallApplicationById(id)
}

export async function deleteFdcStallApplicationRow(id) {
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId < 1) return false

  const [result] = await pool.query(
    'DELETE FROM fdc_stall_applications WHERE id = ? LIMIT 1',
    [numericId],
  )
  if (!result.affectedRows) return false

  // Liberar el correlativo: el próximo INSERT usa MAX(id)+1 (ej. borré #4 → próxima es #4).
  const [rows] = await pool.query(
    'SELECT COALESCE(MAX(id), 0) AS maxId FROM fdc_stall_applications',
  )
  const nextId = Math.max(1, Math.floor(Number(rows[0]?.maxId || 0) + 1))
  await pool.query(`ALTER TABLE fdc_stall_applications AUTO_INCREMENT = ${nextId}`)
  return true
}
