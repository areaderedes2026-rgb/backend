import { asyncHandler } from '../utils/asyncHandler.js'
import {
  importNewsImageFromUrl,
  uploadNewsImageBuffer,
} from '../utils/fileStorage.js'

function parseKind(value) {
  return value === 'cover' ? 'cover' : 'gallery'
}

export const postUploadNewsImage = asyncHandler(async (req, res) => {
  const file = req.file
  if (!file?.buffer) {
    res.status(400).json({ ok: false, error: 'No se recibió ningún archivo.' })
    return
  }
  const kind = parseKind(req.body?.kind)
  const url = await uploadNewsImageBuffer(file.buffer, { kind })
  res.status(201).json({ ok: true, url })
})

export const postImportNewsImageFromUrl = asyncHandler(async (req, res) => {
  const remoteUrl = String(req.body?.url || '').trim()
  if (!remoteUrl) {
    res.status(400).json({ ok: false, error: 'La URL es obligatoria.' })
    return
  }
  const kind = parseKind(req.body?.kind)
  const url = await importNewsImageFromUrl(remoteUrl, { kind })
  res.status(201).json({ ok: true, url })
})
