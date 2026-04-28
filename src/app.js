import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/user.routes.js'
import newsRoutes from './routes/news.routes.js'
import categoryRoutes from './routes/category.routes.js'
import areaRoutes from './routes/area.routes.js'
import historyRoutes from './routes/history.routes.js'
import tourismPlaceRoutes from './routes/tourismPlace.routes.js'
import citizenAttentionRoutes from './routes/citizenAttention.routes.js'
import homeMapRoutes from './routes/homeMap.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import intendenciaRoutes from './routes/intendencia.routes.js'
import { pingDb } from './config/db.js'
import { corsOriginOption } from './config/cors.js'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(
  cors({
    origin: corsOriginOption(),
    credentials: true,
  }),
)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', async (req, res, next) => {
  try {
    await pingDb()
    res.status(200).json({
      ok: true,
      service: 'municipalidad-trancas-api',
      database: 'up',
    })
  } catch (e) {
    next(e)
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/areas', areaRoutes)
app.use('/api/history', historyRoutes)
app.use('/api/tourism-places', tourismPlaceRoutes)
app.use('/api/citizen-attention', citizenAttentionRoutes)
app.use('/api/home-map', homeMapRoutes)
app.use('/api/intendencia', intendenciaRoutes)
app.use('/api/news', newsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export { app }
