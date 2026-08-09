// Shapes the raw responses from ViewerAPI into what the portfolio,
// compare and assistant screens expect. Kept here so those screens do not
// each repeat the same parsing.

import { getStocks, getCrypto, getETF, getData, getNews } from '../api/ViewerAPI'

// Yahoo labels crypto venues "CCC", which means nothing to a reader
const EXCHANGES = { CCC: 'Crypto' }

const ASSET_TYPES = {
  EQUITY:         'Stock',
  ETF:            'ETF',
  MUTUALFUND:     'ETF',
  CRYPTOCURRENCY: 'Crypto',
}

export function parseQuote(payload, symbol) {
  const result = payload?.chart?.result?.[0]
  if (!result) return null

  const meta       = result.meta || {}
  const exchange   = meta.fullExchangeName || meta.exchangeName || ''
  const price      = meta.regularMarketPrice ?? null
  const previous   = meta.chartPreviousClose ?? null
  const timestamps = result.timestamp || []
  const closes     = result.indicators?.quote?.[0]?.close || []

  return {
    symbol,
    name:   meta.longName || meta.shortName || symbol,
    type:   ASSET_TYPES[meta.instrumentType] || 'Stock',
    market: EXCHANGES[exchange] || exchange || '—',
    price,
    changePercent: price !== null && previous ? ((price - previous) / previous) * 100 : null,
    history: timestamps
      .map((ts, i) => ({ recordedAt: new Date(ts * 1000).toISOString(), price: closes[i] }))
      .filter(point => typeof point.price === 'number'),
  }
}

export async function fetchQuote(symbol) {
  try {
    return parseQuote(await getData(symbol), symbol)
  } catch {
    return null
  }
}

// Searches all three asset types at once, since the user does not
// necessarily know which one a symbol belongs to
export async function searchAssets(query) {
  const q = query.trim()
  if (!q) return []

  const results = await Promise.allSettled([
    getStocks(q), getCrypto(q), getETF(q),
  ])

  const types = ['Stock', 'Crypto', 'ETF']
  const found = []

  results.forEach((result, i) => {
    if (result.status !== 'fulfilled' || !Array.isArray(result.value)) return
    result.value.forEach(item => found.push({
      symbol: item.symbol,
      name:   item.securityName || item.symbol,
      type:   types[i],
    }))
  })

  return found.slice(0, 8)
}

export async function fetchAssetDetail(symbol) {
  const [quoteResult, newsResult] = await Promise.allSettled([
    fetchQuote(symbol),
    getNews(symbol),
  ])

  const quote = quoteResult.status === 'fulfilled' ? quoteResult.value : null
  const news  = newsResult.status === 'fulfilled' && Array.isArray(newsResult.value?.data)
    ? newsResult.value.data.slice(0, 5)
    : []

  return {
    symbol,
    name:   quote?.name   || symbol,
    type:   quote?.type   || 'Stock',
    market: quote?.market || '—',
    price:  quote?.price  ?? null,
    changePercent: quote?.changePercent ?? null,
    priceHistory:  quote?.history || [],
    news,
    // The analysis service is not connected, so these stay empty
    sentimentScore:   null,
    sentimentHistory: [],
    mood:       'No data',
    prediction: null,
  }
}
