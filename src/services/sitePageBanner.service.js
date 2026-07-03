import {
  getSitePageBannerRow,
  upsertSitePageBannerRow,
} from '../models/sitePageBanner.model.js'
import { AppError } from '../utils/AppError.js'
import { assertOptimisticLock } from '../utils/concurrency.js'
import { sanitizePageHeroCoverPayload } from '../utils/pageHeroCover.js'

const ALLOWED_PAGE_KEYS = new Set(['news', 'events', 'tourism'])

function cleanPageKey(value) {
  return String(value || '').trim().toLowerCase()
}

function assertAllowedPageKey(pageKey) {
  if (!ALLOWED_PAGE_KEYS.has(pageKey)) {
    throw new AppError('Página de banner no habilitada.', 404)
  }
}

export async function getSitePageBanner(pageKeyRaw) {
  const pageKey = cleanPageKey(pageKeyRaw)
  assertAllowedPageKey(pageKey)
  return getSitePageBannerRow(pageKey)
}

export async function saveSitePageBanner(pageKeyRaw, payload) {
  const pageKey = cleanPageKey(pageKeyRaw)
  assertAllowedPageKey(pageKey)
  const current = await getSitePageBannerRow(pageKey)
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    `banner ${pageKey}`,
    Boolean(payload?.forceOverwrite),
  )
  return upsertSitePageBannerRow(
    pageKey,
    sanitizePageHeroCoverPayload(payload, { current }),
  )
}
