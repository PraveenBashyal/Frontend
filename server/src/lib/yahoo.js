// The one place that talks to Yahoo. The portfolio and the comparison
// chart both read prices from here, so neither depends on the Spring Boot
// /data endpoint, which keeps failing to resolve Yahoo's hostname.

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/'
const TIMEOUT_MS = 8000

const ASSET_TYPES = {
  EQUITY:         'Stock',
  ETF:            'ETF',
  MUTUALFUND:     'ETF',
  CRYPTOCURRENCY: 'Crypto',
}

function shape(payload, symbol) {
  const result = payload?.chart?.result?.[0]
  if (!result) return null

  const meta = result.meta || {}
  const closes = result.indicators?.quote?.[0]?.close || []
  const price = meta.regularMarketPrice ?? null
  const previous = meta.chartPreviousClose ?? null
  const exchange = meta.fullExchangeName || meta.exchangeName || ''

  return {
    symbol,
    name:   meta.longName || meta.shortName || symbol,
    type:   ASSET_TYPES[meta.instrumentType] || 'Stock',
    // Yahoo labels crypto venues "CCC", which means nothing to a reader
    market: exchange === 'CCC' ? 'Crypto' : exchange || null,
    price,
    changePercent: price !== null && previous ? ((price - previous) / previous) * 100 : null,
    // One point per interval, skipping the gaps Yahoo leaves on closed days
    history: (result.timestamp || [])
      .map((seconds, i) => ({ date: seconds * 1000, price: closes[i] }))
      .filter(point => typeof point.price === 'number'),
  }
}

// Returns null rather than throwing, so a missing price thins the answer
// instead of failing the request.
export async function fetchChart(symbol, range = '1mo', interval = '1d') {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const url = `${BASE}${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) return null
    return shape(await response.json(), symbol)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
