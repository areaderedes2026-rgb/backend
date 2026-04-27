import net from 'net'
import {
  cloudinary,
  CLOUDINARY_NEWS_FOLDER,
  CLOUDINARY_IMPORT_ALLOWED_HOSTS,
  CLOUDINARY_IMPORT_MAX_BYTES,
  CLOUDINARY_IMPORT_TIMEOUT_MS,
  ensureCloudinaryConfigured,
  getMissingCloudinaryEnv,
} from '../config/cloudinary.js'
import { AppError } from './AppError.js'

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function cloudinaryFolder(kind = 'gallery') {
  return `${CLOUDINARY_NEWS_FOLDER}/${kind === 'cover' ? 'cover' : 'gallery'}`
}

function uploadBufferToCloudinary(buffer, { kind = 'gallery' } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: cloudinaryFolder(kind),
        resource_type: 'image',
      },
      (err, result) => {
        if (err) {
          reject(err)
          return
        }
        resolve(result)
      },
    )
    stream.end(buffer)
  })
}

function isPrivateIp(hostname) {
  if (!net.isIP(hostname)) return false
  if (net.isIPv4(hostname)) {
    if (hostname.startsWith('10.')) return true
    if (hostname.startsWith('127.')) return true
    if (hostname.startsWith('192.168.')) return true
    const second = Number(hostname.split('.')[1] || 0)
    if (hostname.startsWith('172.') && second >= 16 && second <= 31) return true
    return false
  }
  return hostname === '::1' || hostname.startsWith('fc') || hostname.startsWith('fd')
}

function validateImportUrl(input) {
  let url
  try {
    url = new URL(String(input || '').trim())
  } catch {
    throw new AppError('La URL de imagen no es válida.', 400)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AppError('La URL debe usar http o https.', 400)
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || isPrivateIp(host)) {
    throw new AppError('Host no permitido para importación remota.', 400)
  }
  if (CLOUDINARY_IMPORT_ALLOWED_HOSTS.size > 0) {
    const ok = [...CLOUDINARY_IMPORT_ALLOWED_HOSTS].some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    )
    if (!ok) throw new AppError('El dominio de la URL no está permitido.', 400)
  }
  return url.toString()
}

async function readResponseBufferWithLimit(response, maxBytes) {
  const reader = response.body?.getReader?.()
  if (!reader) {
    const arr = new Uint8Array(await response.arrayBuffer())
    if (arr.byteLength > maxBytes) {
      throw new AppError('La imagen excede el tamaño permitido (5 MB).', 400)
    }
    return Buffer.from(arr)
  }
  const chunks = []
  let total = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const chunk = Buffer.from(value)
    total += chunk.length
    if (total > maxBytes) {
      throw new AppError('La imagen excede el tamaño permitido (5 MB).', 400)
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

export async function uploadNewsImageBuffer(buffer, { kind = 'gallery' } = {}) {
  if (!ensureCloudinaryConfigured()) {
    const missing = getMissingCloudinaryEnv().join(', ')
    throw new AppError(
      `Falta configurar Cloudinary en el backend (${missing || 'CLOUDINARY_*'}).`,
      500,
    )
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError('Archivo de imagen inválido.', 400)
  }
  if (buffer.length > CLOUDINARY_IMPORT_MAX_BYTES) {
    throw new AppError('La imagen excede el tamaño permitido (5 MB).', 400)
  }
  const result = await uploadBufferToCloudinary(buffer, { kind })
  if (!result?.secure_url) {
    throw new AppError('No se pudo obtener la URL de la imagen.', 500)
  }
  return result.secure_url
}

export async function importNewsImageFromUrl(remoteUrl, { kind = 'gallery' } = {}) {
  if (!ensureCloudinaryConfigured()) {
    const missing = getMissingCloudinaryEnv().join(', ')
    throw new AppError(
      `Falta configurar Cloudinary en el backend (${missing || 'CLOUDINARY_*'}).`,
      500,
    )
  }

  const safeUrl = validateImportUrl(remoteUrl)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLOUDINARY_IMPORT_TIMEOUT_MS)
  let response
  try {
    response = await fetch(safeUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    })
  } catch {
    throw new AppError('No se pudo descargar la imagen desde la URL.', 400)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) {
    throw new AppError('No se pudo descargar la imagen desde la URL.', 400)
  }
  const contentLength = Number(response.headers.get('content-length') || 0)
  if (contentLength > CLOUDINARY_IMPORT_MAX_BYTES) {
    throw new AppError('La imagen excede el tamaño permitido (5 MB).', 400)
  }
  const mime = String(response.headers.get('content-type') || '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  if (!ALLOWED_IMAGE_MIME.has(mime)) {
    throw new AppError('La URL no apunta a una imagen válida (JPEG/PNG/WebP/GIF).', 400)
  }
  const buffer = await readResponseBufferWithLimit(response, CLOUDINARY_IMPORT_MAX_BYTES)
  return uploadNewsImageBuffer(buffer, { kind })
}

function isCloudinaryManagedUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return (
      parsed.hostname === 'res.cloudinary.com' &&
      parsed.pathname.includes(`/${process.env.CLOUDINARY_CLOUD_NAME}/`)
    )
  } catch {
    return false
  }
}

function cloudinaryPublicIdFromUrl(url) {
  const parsed = new URL(url)
  const afterUpload = parsed.pathname.split('/upload/')[1]
  if (!afterUpload) return null
  const segments = afterUpload.split('/').filter(Boolean)
  const versionIdx = segments.findIndex((seg) => /^v\d+$/.test(seg))
  const startIdx = versionIdx >= 0 ? versionIdx + 1 : 0
  const asset = segments.slice(startIdx)
  if (!asset.length) return null
  const lastIdx = asset.length - 1
  const file = asset[lastIdx]
  const dot = file.lastIndexOf('.')
  asset[lastIdx] = dot > 0 ? file.slice(0, dot) : file
  return asset.join('/')
}

/** Borra un asset gestionado por Cloudinary. */
export async function deleteManagedFileByUrl(publicUrl) {
  if (!publicUrl || typeof publicUrl !== 'string') return
  if (isCloudinaryManagedUrl(publicUrl) && ensureCloudinaryConfigured()) {
    const publicId = cloudinaryPublicIdFromUrl(publicUrl)
    if (!publicId) return
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  }
}

export async function deleteManagedFilesByUrls(urls) {
  if (!Array.isArray(urls)) return
  for (const u of urls) {
    await deleteManagedFileByUrl(u)
  }
}
