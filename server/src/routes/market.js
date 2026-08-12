import { Router } from 'express'
import { requireAuth } from '../lib/auth.js'
import { fetchChart } from '../lib/yahoo.js'

export const marketRouter = Router()
marketRouter.use(requireAuth)

// A month of daily closes. The Spring Boot /data endpoint only ever
// returns one day of one-minute candles, too short to compare two assets.
marketRouter.get('/asset/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol).toUpperCase()
  const asset = await fetchChart(symbol, '1mo', '1d')

  if (!asset) {
    return res.status(502).json({ error: `No market data for ${symbol}` })
  }

  res.json(asset)
})
