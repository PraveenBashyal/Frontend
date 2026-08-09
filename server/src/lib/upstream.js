// Reads from the Spring Boot backend using the caller's own token, so its
// tables are never queried directly. Every call fails soft: the assistant
// should answer with less rather than error out.

const TIMEOUT_MS = 8000

// Yahoo's instrumentType, mapped to the labels the UI already uses
const ASSET_TYPES = {
  EQUITY:         'Stock',
  ETF:            'ETF',
  MUTUALFUND:     'ETF',
  CRYPTOCURRENCY: 'Crypto',
}

async function call(path, token, method = 'GET') {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${process.env.UPSTREAM_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchWatchlist(token) {
  const data = await call('/watchlist/all', token)
  return Array.isArray(data) ? data : []
}

// Yahoo's chart payload, via the backend
export async function fetchQuote(symbol, token) {
  const data = await call(`/data/${encodeURIComponent(symbol)}`, token, 'POST')
  const meta = data?.chart?.result?.[0]?.meta
  if (!meta) return null

  const price = meta.regularMarketPrice ?? null
  const previous = meta.chartPreviousClose ?? null

  return {
    symbol,
    name:   meta.longName || meta.shortName || symbol,
    type:   ASSET_TYPES[meta.instrumentType] || 'Stock',
    // Yahoo labels crypto venues "CCC", which means nothing to a reader
    market: (meta.fullExchangeName || meta.exchangeName) === 'CCC'
      ? 'Crypto'
      : meta.fullExchangeName || meta.exchangeName || null,
    price,
    changePercent: price !== null && previous ? ((price - previous) / previous) * 100 : null,
  }
}

// Five at a time, to stay under the upstream rate limit
export async function fetchQuotes(symbols, token) {
  const out = []
  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5)
    const quotes = await Promise.all(batch.map(s => fetchQuote(s, token)))
    out.push(...quotes.filter(Boolean))
  }
  return out
}

export async function fetchNews(symbol, token) {
  const data = await call(`/news/${encodeURIComponent(symbol)}`, token, 'POST')
  return Array.isArray(data) ? data.slice(0, 3) : []
}
