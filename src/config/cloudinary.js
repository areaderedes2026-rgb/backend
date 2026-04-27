import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

let configuredSignature = ''

function readCredentials() {
  return {
    cloudName: String(process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    apiKey: String(process.env.CLOUDINARY_API_KEY || '').trim(),
    apiSecret: String(process.env.CLOUDINARY_API_SECRET || '').trim(),
  }
}

export function getMissingCloudinaryEnv() {
  const c = readCredentials()
  const missing = []
  if (!c.cloudName) missing.push('CLOUDINARY_CLOUD_NAME')
  if (!c.apiKey) missing.push('CLOUDINARY_API_KEY')
  if (!c.apiSecret) missing.push('CLOUDINARY_API_SECRET')
  return missing
}

export function isCloudinaryEnabled() {
  return ensureCloudinaryConfigured()
}

export function ensureCloudinaryConfigured() {
  let creds = readCredentials()
  if (!creds.cloudName || !creds.apiKey || !creds.apiSecret) {
    // Permite tomar cambios recientes en .env sin reiniciar manualmente.
    dotenv.config()
    creds = readCredentials()
  }
  if (!creds.cloudName || !creds.apiKey || !creds.apiSecret) {
    configuredSignature = ''
    return false
  }
  const signature = `${creds.cloudName}:${creds.apiKey}:${creds.apiSecret}`
  if (configuredSignature === signature) return true
  cloudinary.config({
    cloud_name: creds.cloudName,
    api_key: creds.apiKey,
    api_secret: creds.apiSecret,
    secure: true,
  })
  configuredSignature = signature
  return true
}

export const CLOUDINARY_NEWS_FOLDER =
  process.env.CLOUDINARY_NEWS_FOLDER || 'municipalidad-trancas/news'
export const CLOUDINARY_IMPORT_MAX_BYTES = Number(
  process.env.CLOUDINARY_IMPORT_MAX_BYTES || 5 * 1024 * 1024,
)
export const CLOUDINARY_IMPORT_TIMEOUT_MS = Number(
  process.env.CLOUDINARY_IMPORT_TIMEOUT_MS || 12_000,
)

const rawHosts = String(process.env.CLOUDINARY_IMPORT_ALLOWED_HOSTS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

export const CLOUDINARY_IMPORT_ALLOWED_HOSTS = new Set(rawHosts)

export { cloudinary }
