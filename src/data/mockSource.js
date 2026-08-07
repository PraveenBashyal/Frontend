// Fake data for developing without a backend. Returns the shapes in
// viewModels.js.

import { MOOD, emptyAsset, moodFromScore, summarise } from './viewModels'

// Tickers copied from src/lists/Stocks, ETFs and Crypto.
// "SQL-USD" is likely a typo for "SOL-USD" in that list — kept as-is
// until the backend team confirms.
const RAW = [
  // Stocks — src/lists/Stocks
  { symbol: 'AAPL',     name: 'Apple Inc.',                    type: 'Stock',  market: 'NASDAQ',    price: 227.52,   score: 0.78 },
  { symbol: 'MSFT',     name: 'Microsoft Corporation',         type: 'Stock',  market: 'NASDAQ',    price: 438.90,   score: 0.66 },
  { symbol: 'NVDA',     name: 'NVIDIA Corporation',            type: 'Stock',  market: 'NASDAQ',    price: 141.05,   score: 0.83 },
  { symbol: 'TSLA',     name: 'Tesla, Inc.',                   type: 'Stock',  market: 'NASDAQ',    price: 412.18,   score: 0.31 },
  { symbol: 'AMZN',     name: 'Amazon.com, Inc.',              type: 'Stock',  market: 'NASDAQ',    price: 218.34,   score: 0.62 },
  { symbol: 'META',     name: 'Meta Platforms, Inc.',          type: 'Stock',  market: 'NASDAQ',    price: 597.20,   score: 0.71 },
  { symbol: 'GOOGL',    name: 'Alphabet Inc.',                 type: 'Stock',  market: 'NASDAQ',    price: 176.45,   score: 0.55 },
  { symbol: 'NFLX',     name: 'Netflix, Inc.',                 type: 'Stock',  market: 'NASDAQ',    price: 892.60,   score: 0.44 },
  { symbol: 'AMD',      name: 'Advanced Micro Devices, Inc.',  type: 'Stock',  market: 'NASDAQ',    price: 124.83,   score: 0.38 },
  { symbol: 'AVGO',     name: 'Broadcom Inc.',                 type: 'Stock',  market: 'NASDAQ',    price: 232.17,   score: null },

  // ETFs — src/lists/ETFs
  { symbol: 'SPY',      name: 'SPDR S&P 500 ETF Trust',        type: 'ETF',    market: 'NYSE Arca', price: 601.12,   score: 0.61 },
  { symbol: 'QQQ',      name: 'Invesco QQQ Trust',             type: 'ETF',    market: 'NASDAQ',    price: 528.44,   score: 0.64 },
  { symbol: 'VOO',      name: 'Vanguard S&P 500 ETF',          type: 'ETF',    market: 'NYSE Arca', price: 552.30,   score: 0.59 },
  { symbol: 'VTI',      name: 'Vanguard Total Stock Market ETF', type: 'ETF', market: 'NYSE Arca', price: 296.75,   score: 0.57 },
  { symbol: 'IWM',      name: 'iShares Russell 2000 ETF',      type: 'ETF',    market: 'NYSE Arca', price: 238.91,   score: 0.42 },
  { symbol: 'DIA',      name: 'SPDR Dow Jones Industrial Average ETF', type: 'ETF', market: 'NYSE Arca', price: 445.08, score: 0.53 },
  { symbol: 'ARKK',     name: 'ARK Innovation ETF',            type: 'ETF',    market: 'NYSE Arca', price: 62.40,    score: 0.29 },
  { symbol: 'GLD',      name: 'SPDR Gold Shares',              type: 'ETF',    market: 'NYSE Arca', price: 248.66,   score: 0.68 },
  { symbol: 'TLT',      name: 'iShares 20+ Year Treasury Bond ETF', type: 'ETF', market: 'NASDAQ',  price: 88.25,    score: 0.36 },
  { symbol: 'XLK',      name: 'Technology Select Sector SPDR Fund', type: 'ETF', market: 'NYSE Arca', price: 241.53, score: null },

  // Crypto — Yahoo Finance "-USD" ticker format
  { symbol: 'BTC-USD',  name: 'Bitcoin',                       type: 'Crypto', market: 'Binance',    price: 96420.00, score: 0.71 },
  { symbol: 'ETH-USD',  name: 'Ethereum',                      type: 'Crypto', market: 'Binance',    price: 3380.45,  score: 0.48 },
  { symbol: 'BNB-USD',  name: 'BNB',                           type: 'Crypto', market: 'Binance',    price: 712.90,   score: 0.58 },
  { symbol: 'SQL-USD',  name: 'Solana',                        type: 'Crypto', market: 'Binance',    price: 214.30,   score: 0.29 },
  { symbol: 'XRP-USD',  name: 'XRP',                           type: 'Crypto', market: 'Binance',    price: 2.34,     score: 0.67 },
  { symbol: 'ADA-USD',  name: 'Cardano',                       type: 'Crypto', market: 'Binance',    price: 0.98,     score: 0.41 },
  { symbol: 'DOGE-USD', name: 'Dogecoin',                      type: 'Crypto', market: 'Binance',    price: 0.37,     score: 0.52 },
  { symbol: 'AVAX-USD', name: 'Avalanche',                     type: 'Crypto', market: 'Binance',    price: 41.62,    score: 0.35 },
  { symbol: 'DOT-USD',  name: 'Polkadot',                      type: 'Crypto', market: 'Binance',    price: 7.15,     score: 0.33 },
  { symbol: 'LINK-USD', name: 'Chainlink',                     type: 'Crypto', market: 'Binance',    price: 24.88,    score: 0.63 },
]

function toAsset(raw, extra = {}) {
  return emptyAsset({
    symbol:         raw.symbol,
    name:           raw.name,
    type:           raw.type,
    market:         raw.market,
    price:          raw.price,
    priceDirection: raw.score === null ? 'No data' : raw.score >= 0.5 ? 'Up' : 'Down',
    mood:           moodFromScore(raw.score),
    sentimentScore: raw.score,
    prediction:     raw.score === null ? null
                    : raw.score >= 0.6 ? 'Positive'
                    : raw.score <= 0.4 ? 'Negative' : 'Neutral',
    ...extra,
  })
}

const ASSETS = RAW.map(r => toAsset(r))

// Kept in localStorage so add/remove survives a page change
const WATCHLIST_KEY = 'mockWatchlist'

function readWatchlist() {
  try {
    const stored = JSON.parse(localStorage.getItem(WATCHLIST_KEY))
    if (Array.isArray(stored)) return stored
  } catch {
    // Bad JSON — use the default
  }
  return ['AAPL', 'BTC-USD', 'SPY']
}

function writeWatchlist(symbols) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(symbols))
}

const delay = (ms = 220) => new Promise(resolve => setTimeout(resolve, ms))

// ─── Alerts ───────────────────────────────────────────────────
// One alert per third asset, so the list looks like events rather than a
// copy of the table. previousMood differs from mood to give the UI a shift.
const ALERT_STATE_KEY = 'mockAlertState'

const ALERTS = ASSETS
  .filter(a => a.sentimentScore !== null)
  .filter((_, i) => i % 3 === 0)
  .map((asset, i) => ({
    id:             `alert-${asset.symbol}`,
    symbol:         asset.symbol,
    name:           asset.name,
    type:           asset.type,
    mood:           asset.mood,
    previousMood:   asset.mood === MOOD.BULLISH ? MOOD.NEUTRAL
                    : asset.mood === MOOD.BEARISH ? MOOD.NEUTRAL
                    : MOOD.BULLISH,
    sentimentScore: asset.sentimentScore,
    createdAt:      new Date(Date.now() - (i + 1) * 47 * 60 * 1000).toISOString(),
  }))

function readAlertState() {
  try {
    const stored = JSON.parse(localStorage.getItem(ALERT_STATE_KEY))
    if (stored && Array.isArray(stored.dismissed) && Array.isArray(stored.read)) {
      return stored
    }
  } catch {
    // Bad JSON — use the default
  }
  return { dismissed: [], read: [] }
}

function writeAlertState(state) {
  localStorage.setItem(ALERT_STATE_KEY, JSON.stringify(state))
}

// Price series around the current price, seeded by symbol so reloads match
function makePriceHistory(symbol, price, points = 40) {
  if (price === null) return []
  let seed = [...symbol].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }

  const now = Date.now()
  const history = []
  let value = price * 0.97
  for (let i = points - 1; i >= 0; i--) {
    value += (random() - 0.48) * price * 0.012
    history.push({
      recordedAt: new Date(now - i * 15 * 60 * 1000).toISOString(),
      price:      Number(value.toFixed(2)),
    })
  }
  // Last point must equal the current price shown in the header
  history[history.length - 1].price = price
  return history
}

function makeSentimentHistory(symbol, score, points = 24) {
  if (score === null) return []
  let seed = [...symbol].reduce((acc, ch) => acc + ch.charCodeAt(0) * 7, 0)
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }

  const now = Date.now()
  const history = []
  for (let i = points - 1; i >= 0; i--) {
    const drift = (random() - 0.5) * 0.22
    history.push({
      analysedAt: new Date(now - i * 60 * 60 * 1000).toISOString(),
      value:      Number(Math.min(1, Math.max(0, score + drift)).toFixed(2)),
    })
  }
  history[history.length - 1].value = score
  return history
}

function makeNews(asset) {
  return [
    {
      headline: `${asset.name} beats quarterly expectations`,
      source:   'MarketWatch',
      summary:  `Analysts point to stronger-than-expected demand for ${asset.name}, with revenue coming in above consensus estimates.`,
      image:    '',
      url:      '',
    },
    {
      headline: `What ${asset.symbol} investors should watch this week`,
      source:   'Reuters',
      summary:  `Volatility in the ${asset.market} session has traders repositioning ahead of the next macro print.`,
      image:    '',
      url:      '',
    },
    {
      headline: `${asset.symbol} sentiment turns ${asset.mood.toLowerCase()}`,
      source:   'Bloomberg',
      summary:  `Social and news sentiment for ${asset.symbol} shifted over the last 24 hours, according to aggregated model output.`,
      image:    '',
      url:      '',
    },
  ]
}

// ─── Chat ─────────────────────────────────────────────────────
// Replies are built from the same ASSETS the dashboard shows
function findAsset(symbol) {
  if (!symbol) return null
  return ASSETS.find(a => a.symbol === symbol) || null
}

function describeAsset(asset) {
  if (asset.sentimentScore === null) {
    return `${asset.symbol} has no sentiment score yet — it is still awaiting analysis. `
         + `It trades on ${asset.market} at $${asset.price.toLocaleString()}.`
  }

  return `${asset.name} (${asset.symbol}) is currently ${asset.mood.toLowerCase()} `
       + `with a sentiment score of ${asset.sentimentScore.toFixed(2)}. `
       + `The model predicts a ${String(asset.prediction).toLowerCase()} short-term move, `
       + `and price direction over the last session was ${asset.priceDirection.toLowerCase()}. `
       + `It trades on ${asset.market} at $${asset.price.toLocaleString()}.`
}

function answerFor(message, asset) {
  const q = message.toLowerCase()

  if (!asset) {
    const summary = summarise(ASSETS)
    return `Across the ${summary.total} tracked assets, overall mood is `
         + `${summary.overallMood.toLowerCase()} — ${summary.bullish} bullish, `
         + `${summary.bearish} bearish, ${summary.neutral} neutral, `
         + `and ${summary.noData} still awaiting analysis. `
         + `Open an asset and ask again for a breakdown of that one.`
  }

  if (q.includes('why') || q.includes('driving') || q.includes('reason')) {
    return `${describeAsset(asset)} The score is aggregated from recent social posts `
         + `and news headlines; the strongest contributors are listed below.`
  }

  if (q.includes('predict') || q.includes('forecast') || q.includes('next')) {
    return asset.prediction
      ? `The current short-term prediction for ${asset.symbol} is ${asset.prediction.toLowerCase()}, `
      + `derived from its ${asset.sentimentScore.toFixed(2)} sentiment score combined with recent price history. `
      + `This is model output, not advice.`
      : `${asset.symbol} has no prediction yet — it needs a sentiment score first.`
  }

  if (q.includes('week') || q.includes('trend') || q.includes('history')) {
    return `Over the recent window, ${asset.symbol} sentiment has stayed in the `
         + `${asset.mood.toLowerCase()} band. See the sentiment trend chart on its detail page `
         + `for the full series.`
  }

  return describeAsset(asset)
}

export async function sendChatMessage(message, context = {}) {
  await delay(900)

  if (!message.trim()) throw new Error('Message cannot be empty')

  const asset = findAsset(context.symbol)

  return {
    answer: answerFor(message, asset),
    sources: asset
      ? makeNews(asset).slice(0, 2).map(item => ({
          platform: item.source,
          text:     item.headline,
          symbol:   asset.symbol,
        }))
      : [],
  }
}

// ─── Public API ───────────────────────────────────────────────

// AuthContext calls jwtDecode(), so the token must have the three JWT
// parts. The signature is not verified anywhere.
function fakeJwt(username) {
  const encode = obj =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const header  = encode({ alg: 'none', typ: 'JWT' })
  const payload = encode({
    sub: username,
    name: username,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  })
  return `${header}.${payload}.mock-signature`
}

export async function login({ username, password }) {
  await delay()
  if (!username || !password) throw new Error('Please fill in all fields')
  return { AccessToken: fakeJwt(username) }
}

// Same payload investor/register expects
export async function register(form) {
  await delay(400)

  // The backend requires every one of these
  const required = [
    'firstName', 'lastName', 'username', 'password',
    'email', 'phoneNumber', 'dateOfBirth',
  ]
  const missing = required.filter(field => !form[field]?.trim())
  if (missing.length) throw new Error('Please fill in all required fields')

  if (form.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }
  if (form.username.toLowerCase() === 'taken') {
    throw new Error('That username is already registered')
  }

  return { username: form.username }
}

// ─── Portfolio ────────────────────────────────────────────────
const PORTFOLIO_KEY = 'mockPortfolio'

// Two sample holdings so the page is not empty on a first visit
const DEFAULT_HOLDINGS = [
  { id: 'h1', symbol: 'AAPL',    quantity: 12, buyPrice: 198.4,  buyDate: '2026-04-18' },
  { id: 'h2', symbol: 'BTC-USD', quantity: 0.15, buyPrice: 71250, buyDate: '2026-02-03' },
]

function readHoldings() {
  try {
    const stored = JSON.parse(localStorage.getItem(PORTFOLIO_KEY))
    if (Array.isArray(stored)) return stored
  } catch {
    // Bad JSON — fall back to the samples
  }
  return DEFAULT_HOLDINGS
}

function writeHoldings(holdings) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings))
}

// Joins the asset name, type and current price onto each holding
function decorate(holding) {
  const asset = ASSETS.find(item => item.symbol === holding.symbol)
  return {
    ...holding,
    name:  asset?.name || holding.symbol,
    type:  asset?.type || 'Stock',
    price: asset?.price ?? null,
  }
}

export async function fetchPortfolio() {
  await delay()
  return readHoldings().map(decorate)
}

export async function addHolding(entry) {
  await delay(400)

  const symbol   = entry.symbol?.trim().toUpperCase()
  const quantity = Number(entry.quantity)
  const buyPrice = Number(entry.buyPrice)

  if (!symbol) throw new Error('Choose an asset')
  if (!ASSETS.some(item => item.symbol === symbol)) {
    throw new Error(`${symbol} is not a tracked asset`)
  }
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error('Quantity must be greater than 0')
  if (!Number.isFinite(buyPrice) || buyPrice <= 0) throw new Error('Buy price must be greater than 0')
  if (!entry.buyDate) throw new Error('Choose a purchase date')
  if (new Date(entry.buyDate) > new Date()) throw new Error('Purchase date cannot be in the future')

  const holding = {
    id: `h${Date.now()}`,
    symbol,
    quantity,
    buyPrice,
    buyDate: entry.buyDate,
  }

  writeHoldings([...readHoldings(), holding])
  return decorate(holding)
}

export async function removeHolding(id) {
  await delay(300)
  writeHoldings(readHoldings().filter(holding => holding.id !== id))
}

// ─── Profile (FR-07) ──────────────────────────────────────────
const PROFILE_KEY = 'mockProfile'

const DEFAULT_PROFILE = {
  username:    'giabao',
  firstName:   'Bao',
  lastName:    'Tran',
  email:       'baotran@example.com',
  phoneNumber: '0912 345 678',
  dateOfBirth: '2003-05-14',
  createdAt:   '2026-03-21T09:00:00.000Z',
}

function readProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY))
    if (stored && typeof stored === 'object') {
      return { ...DEFAULT_PROFILE, ...stored }
    }
  } catch {
    // Bad JSON — use the default
  }
  return DEFAULT_PROFILE
}

export async function fetchProfile() {
  await delay()
  return readProfile()
}

export async function updateProfile(changes) {
  await delay(400)

  if (!changes.email?.trim()) throw new Error('Email is required')

  // username and createdAt are read-only
  const EDITABLE = ['firstName', 'lastName', 'email', 'phoneNumber', 'dateOfBirth']
  const edits = Object.fromEntries(
    EDITABLE.filter(field => field in changes).map(field => [field, changes[field]])
  )

  const next = { ...readProfile(), ...edits }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
  return next
}

export async function changePassword({ currentPassword, newPassword }) {
  await delay(400)

  // Any password works except "wrong", for testing the error state
  if (currentPassword === 'wrong') {
    throw new Error('Current password is incorrect')
  }
  if (currentPassword === newPassword) {
    throw new Error('New password must differ from the current one')
  }
}

export async function fetchMarketOverview() {
  await delay()
  return { assets: ASSETS, summary: summarise(ASSETS) }
}

export async function fetchWatchlist() {
  await delay()
  const symbols = readWatchlist()
  return ASSETS
    .filter(a => symbols.includes(a.symbol))
    .map((a, i) => ({
      ...a,
      addedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    }))
}

export async function searchAssets(query, type) {
  await delay(120)
  const q = query.trim().toLowerCase()
  if (!q) return []
  return ASSETS.filter(a =>
    (!type || a.type === type) &&
    (a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
  )
}

export async function fetchAssetDetail(symbol) {
  await delay()
  const asset = ASSETS.find(a => a.symbol.toLowerCase() === symbol.toLowerCase())
  if (!asset) throw new Error(`Unknown symbol: ${symbol}`)

  return {
    ...asset,
    description: `${asset.name} (${asset.symbol}) is traded on ${asset.market}. `
      + `This description is mock content — it will be replaced by the backend's `
      + `company profile endpoint.`,
    news:             makeNews(asset),
    priceHistory:     makePriceHistory(asset.symbol, asset.price),
    sentimentHistory: makeSentimentHistory(asset.symbol, asset.sentimentScore),
  }
}

export async function addToWatchlist(asset) {
  await delay(150)
  const symbols = readWatchlist()
  if (!symbols.includes(asset.symbol)) writeWatchlist([...symbols, asset.symbol])
}

export async function removeFromWatchlist(symbol) {
  await delay(150)
  writeWatchlist(readWatchlist().filter(s => s !== symbol))
}

export async function analyzeAsset() {
  await delay(600)
}

export async function fetchAlerts() {
  await delay()
  const { dismissed, read } = readAlertState()
  return ALERTS
    .filter(alert => !dismissed.includes(alert.id))
    .map(alert => ({ ...alert, read: read.includes(alert.id) }))
}

export async function dismissAlert(id) {
  await delay(120)
  const state = readAlertState()
  if (!state.dismissed.includes(id)) {
    writeAlertState({ ...state, dismissed: [...state.dismissed, id] })
  }
}

export async function clearAlerts() {
  await delay(150)
  const state = readAlertState()
  writeAlertState({ ...state, dismissed: ALERTS.map(a => a.id) })
}

export async function markAlertsRead() {
  await delay(80)
  const state = readAlertState()
  writeAlertState({ ...state, read: ALERTS.map(a => a.id) })
}
