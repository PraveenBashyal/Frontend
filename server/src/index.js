import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { marketRouter } from './routes/market.js'

const PORT = Number(process.env.PORT) || 8082

const app = express()

app.use(cors({ origin: process.env.WEB_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '64kb' }))

app.get('/health', (_req, res) => {
  res.json({ service: 'capstone-service', upstream: process.env.UPSTREAM_URL })
})

app.use('/market', marketRouter)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.use((error, _req, res, _next) => {
  console.error('[error]', error)
  res.status(500).json({ error: 'Something went wrong on the server' })
})

app.listen(PORT, () => {
  console.log(`[service] http://localhost:${PORT}`)
})
