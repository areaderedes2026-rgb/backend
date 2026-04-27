import mysql from 'mysql2/promise'

function parseMysqlUrl(rawUrl) {
  if (!rawUrl) return null
  try {
    const u = new URL(rawUrl)
    const database = decodeURIComponent((u.pathname || '').replace(/^\//, ''))
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username || ''),
      password: decodeURIComponent(u.password || ''),
      database,
    }
  } catch {
    return null
  }
}

function envFirst(...keys) {
  for (const key of keys) {
    const v = process.env[key]
    if (v != null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function resolvePrimaryConfig() {
  const fromUrl = parseMysqlUrl(process.env.MYSQL_URL)
  return {
    host:
      envFirst('MYSQL_HOST', 'MYSQLHOST') ||
      fromUrl?.host ||
      '127.0.0.1',
    port: Number(envFirst('MYSQL_PORT', 'MYSQLPORT') || fromUrl?.port || 3306),
    user:
      envFirst('MYSQL_USER', 'MYSQLUSER') ||
      fromUrl?.user ||
      'root',
    password:
      envFirst('MYSQL_PASSWORD', 'MYSQLPASSWORD') ||
      fromUrl?.password ||
      '',
    database:
      envFirst('MYSQL_DATABASE', 'MYSQLDATABASE') ||
      fromUrl?.database ||
      'municipalidad_trancas',
  }
}

function resolvePublicFallbackConfig() {
  const fromPublic = parseMysqlUrl(process.env.MYSQL_PUBLIC_URL)
  if (!fromPublic) return null
  return {
    host: fromPublic.host,
    port: Number(fromPublic.port || 3306),
    user: fromPublic.user || 'root',
    password: fromPublic.password || '',
    database: fromPublic.database || 'municipalidad_trancas',
  }
}

function createPool(cfg) {
  return mysql.createPool({
    host: cfg.host,
    port: Number(cfg.port),
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    /** Evita esperas indefinidas si MySQL no está levantado. */
    connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT_MS || 8000),
  })
}

let pool = createPool(resolvePrimaryConfig())
let usingPublicFallback = false

export async function pingDb() {
  let conn
  try {
    conn = await pool.getConnection()
    await conn.ping()
  } catch (err) {
    const fallbackCfg = resolvePublicFallbackConfig()
    const canRetryWithPublic =
      err?.code === 'ENOTFOUND' && !usingPublicFallback && Boolean(fallbackCfg)
    if (!canRetryWithPublic) throw err

    console.warn(
      'MySQL interno no resolvio DNS. Reintentando con MYSQL_PUBLIC_URL...',
    )
    pool = createPool(fallbackCfg)
    usingPublicFallback = true
    conn = await pool.getConnection()
    await conn.ping()
  } finally {
    if (conn) conn.release()
  }
}

export { pool }
