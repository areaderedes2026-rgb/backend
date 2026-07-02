import {
  getAreasPageContentRow,
  upsertAreasPageContentRow,
} from '../models/areasPage.model.js'
import { assertOptimisticLock } from '../utils/concurrency.js'
import { sanitizePageHeroCoverPayload } from '../utils/pageHeroCover.js'

export async function getAreasPageContent() {
  return getAreasPageContentRow()
}

export async function saveAreasPageContent(payload) {
  const current = await getAreasPageContentRow()
  assertOptimisticLock(
    payload?.expectedUpdatedAt,
    current?.updatedAt,
    'contenido de áreas',
    Boolean(payload?.forceOverwrite),
  )
  return upsertAreasPageContentRow(sanitizePageHeroCoverPayload(payload, { current }))
}
