// Maps the backend (:8081) onto the shapes in viewModels.js.
// Edit this file — and only this file — when the backend gains endpoints.
// Gaps are marked TODO(backend) and return empty values for now.

import {
  login as apiLogin,
  InvestorRegistration,
  getStocks,
  getCrypto,
  getETF,
  getWatchlist,
  addStockToWatchlist,
  deteleWatchlist,
  getTitle,
  getNews,
  getData,
} from '../api/ViewerAPI'

import privateAPI from '../api/privateAPI'
import stockList  from '../lists/Stocks?raw'
import etfList    from '../lists/ETFs?raw'
import cryptoList from '../lists/Crypto?raw'
import { jwtDecode } from 'jwt-decode'
import { emptyAsset, moodFromScore, summarise } from './viewModels'

// Search returns { symbol, securityName, type } for all three asset types
function normaliseListItem(item, fallbackType) {
  return emptyAsset({
    symbol: item.symbol,
    name:   item.securityName || item.symbol,
    type:   item.type || fallbackType || 'Stock',
    market: item.market || '—',
    // Price is filled in by withPrices(); mood/sentimentScore/prediction
    // stay null until the backend exposes them
  })
}

// ─── Sentiment ────────────────────────────────────────────────
// No GET endpoint, so analyzeAsset() caches what POST /store returns
const sentimentCache = new Map()

// TODO(backend): confirm the score range. Negatives are rescaled from
// -1..1, anything else is treated as 0..1.
function normaliseScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return null
  return score < 0 ? (score + 1) / 2 : score
}

function parseSentiment(rows) {
  const points = rows
    .map(row => ({
      analysedAt: row.created_at || row.createdAt || null,
      value:      normaliseScore(row.sentimentScore),
    }))
    .filter(point => point.analysedAt && point.value !== null)
    .sort((a, b) => new Date(a.analysedAt) - new Date(b.analysedAt))

  const average = points.length
    ? points.reduce((sum, point) => sum + point.value, 0) / points.length
    : null

  return { sentimentHistory: points, sentimentScore: average }
}

// Yahoo reports crypto as trading on "CCC", which means nothing to a reader
const EXCHANGE_LABELS = { CCC: 'Crypto' }

// getData() returns a raw Yahoo Finance chart payload
function parseChart(payload) {
  const result = payload?.chart?.result?.[0]
  if (!result) {
    return { name: '', market: '—', price: null, priceDirection: 'No data', priceHistory: [] }
  }

  const exchange   = result.meta?.fullExchangeName || result.meta?.exchangeName || ''
  const market     = EXCHANGE_LABELS[exchange] || exchange || '—'
  const name       = result.meta?.longName || result.meta?.shortName || ''
  const price      = result.meta?.regularMarketPrice ?? null
  const prevClose  = result.meta?.chartPreviousClose ?? null
  const timestamps = result.timestamp || []
  const closes     = result.indicators?.quote?.[0]?.close || []

  const priceHistory = timestamps
    .map((ts, i) => ({
      recordedAt: new Date(ts * 1000).toISOString(),
      price:      closes[i],
    }))
    .filter(point => typeof point.price === 'number')

  let priceDirection = 'No data'
  if (price !== null && prevClose !== null) {
    priceDirection = price > prevClose ? 'Up' : price < prevClose ? 'Down' : 'Flat'
  }

  return { name, market, price, priceDirection, priceHistory }
}

// One request per symbol; batched to stay under the upstream rate limit
const PRICE_BATCH = 5

async function withPrices(assets) {
  const priced = []

  for (let i = 0; i < assets.length; i += PRICE_BATCH) {
    const batch = assets.slice(i, i + PRICE_BATCH)
    const results = await Promise.allSettled(batch.map(a => getData(a.symbol)))

    batch.forEach((asset, j) => {
      const result = results[j]
      if (result.status !== 'fulfilled') {
        priced.push(asset)
        return
      }
      // Yahoo carries the company name, so a symbol-only list still
      // shows something readable
      const { name, market, price, priceDirection } = parseChart(result.value)
      priced.push({
        ...asset,
        name: asset.name || name || asset.symbol,
        market, price, priceDirection,
      })
    })
  }

  return priced
}

// ─── Errors ───────────────────────────────────────────────────
// The backend sends error text as a plain string body, Java stack
// messages included. Those are replaced with a readable fallback.
const JAVA_NOISE = /Cannot invoke|NullPointerException|^java\.|^org\.springframework/

function describeApiError(error, fallback) {
  if (!error.response) {
    return 'Cannot reach the server. Check that the backend is running.'
  }

  const { status, data } = error.response
  const text = typeof data === 'string' ? data.trim() : data?.message

  if (text && !JAVA_NOISE.test(text)) return text
  if (status === 401 || status === 403) return 'Your session has expired. Please sign in again.'
  return fallback
}

// ─── Public API ───────────────────────────────────────────────

export async function login(loginData) {
  try {
    const response = await apiLogin(loginData)
    return response.data   // { AccessToken } — AuthContext handles storing it
  } catch (error) {
    // Wrong password gives 404, unknown username gives 400
    const status = error.response?.status
    if (status === 404 || status === 400) {
      throw new Error('Incorrect username or password', { cause: error })
    }
    throw new Error(
      describeApiError(error, 'Could not sign in. Please try again.'),
      { cause: error },
    )
  }
}

export async function register(form) {
  try {
    const response = await InvestorRegistration(form)
    return response.data
  } catch (error) {
    throw new Error(
      describeApiError(error, 'Could not create the account. Please try again.'),
      { cause: error },
    )
  }
}

// ─── Profile (FR-07) ──────────────────────────────────────────
// TODO(backend): no GET investor/me, and investor/all returns every user.
// Falls back to the JWT claims, which only carry sub/Name/Role.
export async function fetchProfile() {
  let claims = {}
  try {
    const token = localStorage.getItem('accessToken')
    if (token) claims = jwtDecode(token)
  } catch {
    // Malformed token — leave the fields empty
  }

  return {
    username:    claims.sub || claims.username || '',
    firstName:   claims.firstName || '',
    lastName:    claims.lastName || '',
    email:       claims.email || '',
    phoneNumber: '',
    dateOfBirth: '',
    createdAt:   null,
  }
}

export async function updateProfile() {
  // TODO(backend): needs PUT investor/me
  throw new Error('Profile update endpoint not available yet')
}

export async function changePassword() {
  // TODO(backend): needs POST investor/change-password
  throw new Error('Password change endpoint not available yet')
}

// ─── Chat ─────────────────────────────────────────────────────
// TODO(backend): needs POST /chat taking { message, context, history }
// and returning { answer, sources[] }. The LLM key must stay server-side.
export async function sendChatMessage() {
  throw new Error('Chat endpoint not available yet')
}

// The tickers the team picked, in src/lists. Used as the dashboard's
// universe because the backend has no "featured assets" endpoint.
function readList(text, type) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(symbol => emptyAsset({ symbol, name: '', type }))
}

const UNIVERSE = [
  ...readList(stockList,  'Stock'),
  ...readList(etfList,    'ETF'),
  ...readList(cryptoList, 'Crypto'),
]

export async function fetchMarketOverview() {
  // TODO(backend): no endpoint returning a set of assets, so prices come
  // one request per symbol. A bulk quote endpoint would replace this.
  const assets = await withPrices(UNIVERSE)
  return { assets, summary: summarise(assets) }
}

// TODO(backend): watchlist/all has no user filter, so it returns every
// investor's rows, not just the signed-in user's.
export async function fetchWatchlist() {
  const data = await getWatchlist()
  const items = Array.isArray(data) ? data : []

  const assets = items.map(item => ({
    ...normaliseListItem(item),
    addedAt: item.addedDate || item.added_date || null,
  }))

  return withPrices(assets)
}

export async function searchAssets(query, type) {
  if (!query.trim()) return []

  const fetcher = type === 'Crypto' ? getCrypto
                : type === 'ETF'    ? getETF
                :                     getStocks

  const data = await fetcher(query)
  const items = Array.isArray(data) ? data : []
  return items.map(item => normaliseListItem(item, type))
}

export async function fetchAssetDetail(symbol) {
  // allSettled: one failing endpoint must not blank the whole page
  const [titleRes, newsRes, chartRes] = await Promise.allSettled([
    getTitle(symbol),
    getNews(symbol),
    getData(symbol),
  ])

  const description = titleRes.status === 'fulfilled'
    ? (titleRes.value?.data?.extract || '')
    : ''

  const rawNews = newsRes.status === 'fulfilled' && Array.isArray(newsRes.value?.data)
    ? newsRes.value.data
    : []

  const chart = chartRes.status === 'fulfilled'
    ? parseChart(chartRes.value)
    : { name: '', market: '—', price: null, priceDirection: 'No data', priceHistory: [] }

  // Only populated after the Analyze button has run for this symbol
  const sentiment = sentimentCache.get(symbol)
    || { sentimentHistory: [], sentimentScore: null }

  return emptyAsset({
    symbol,
    // Yahoo supplies the company name and the exchange
    name:           chart.name || symbol,
    market:         chart.market,
    description,
    news: rawNews.map(n => ({
      headline: n.headline,
      source:   n.source,
      summary:  n.summary,
      image:    n.image || '',
      url:      n.url || '',
    })),
    price:          chart.price,
    priceDirection: chart.priceDirection,
    priceHistory:   chart.priceHistory,
    sentimentScore:   sentiment.sentimentScore,
    sentimentHistory: sentiment.sentimentHistory,
    mood:             moodFromScore(sentiment.sentimentScore),
    // TODO(backend): no prediction endpoint — PredictionController is empty
  })
}

export async function addToWatchlist(asset) {
  return addStockToWatchlist({
    symbol:       asset.symbol,
    securityName: asset.name,
    type:         asset.type,
  })
}

export async function removeFromWatchlist(symbol) {
  return deteleWatchlist(symbol)
}

export async function analyzeAsset(symbol) {
  const query = encodeURIComponent(symbol)

  // /store only reads news already in the DB, so fetch it first
  await privateAPI.get(`/marketNews?symbol=${query}`)

  const response = await privateAPI.post(`/store?symbol=${query}`)
  const rows = Array.isArray(response.data) ? response.data : []
  sentimentCache.set(symbol, parseSentiment(rows))
}

// ─── Portfolio ────────────────────────────────────────────────
// TODO(backend): needs a `portfolio` table keyed by investor, plus
// GET /portfolio, POST /portfolio { symbol, quantity, buyPrice, buyDate }
// and DELETE /portfolio/{id}. Current prices are joined in here.
export async function fetchPortfolio() {
  return []
}

export async function addHolding() {
  throw new Error('Portfolio endpoint not available yet')
}

export async function removeHolding() {
  throw new Error('Portfolio endpoint not available yet')
}

// ─── Alerts (FR-05) ───────────────────────────────────────────
// TODO(backend): AlertController is empty. Alerts need the asset name and
// mood joined in, not just ids. Empty array keeps the UI on its empty state.
export async function fetchAlerts() {
  return []
}

export async function dismissAlert() {
  throw new Error('Alerts endpoint not available yet')
}

export async function clearAlerts() {
  throw new Error('Alerts endpoint not available yet')
}

export async function markAlertsRead() {
  // No endpoint — no-op
}
