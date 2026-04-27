import 'dotenv/config'
import { app } from './app.js'
import { pingDb } from './config/db.js'

const port = Number(process.env.PORT || 4000)
async function bootstrap() {
  try {
    await pingDb()
    console.log('Conexion a MySQL: OK')
  } catch (err) {
    const reason = err?.code ? `${err.code}: ${err.message}` : err?.message || String(err)
    console.error(`No se pudo conectar a MySQL al iniciar -> ${reason}`)
    process.exit(1)
  }

  const server = app.listen(port, () => {
    console.log(`API escuchando en http://127.0.0.1:${port}`)
    console.log(`  Salud: GET http://127.0.0.1:${port}/api/health`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\nEl puerto ${port} ya está en uso (¿quedó otra instancia del servidor abierta?).\n` +
          `Opciones: cerrá ese proceso, o definí otro puerto en .env: PORT=4001\n`,
      )
    } else {
      console.error(err)
    }
    process.exit(1)
  })
}

bootstrap()
