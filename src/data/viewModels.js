// Data shapes the UI reads. Both mockSource and apiSource must return these.
//
// AssetView       { symbol, name, type, market, price, priceDirection,
//                   mood, sentimentScore, prediction, addedAt }
// AssetDetailView   AssetView + { description, news[], priceHistory[],
//                                 sentimentHistory[] }
// SummaryView     { overallMood, total, bullish, bearish, neutral, noData }
// NewsItem        { headline, source, summary, image, url }
// PricePoint      { recordedAt, price }
// SentimentPoint  { analysedAt, value }
// AlertView       { id, symbol, name, type, mood, previousMood,
//                   sentimentScore, createdAt, read }
// ChatReply       { answer, sources[] }
// ChatSource      { platform, text, symbol }
// HoldingView     { id, symbol, name, type, quantity, buyPrice, buyDate,
//                   price, cost, value, profit, profitPercent }
// ProfileView     { username, firstName, lastName, email, phoneNumber,
//                   dateOfBirth, createdAt }
//
// price / sentimentScore / prediction are null when there is no data yet.

export const MOOD = {
  BULLISH: 'Bullish',
  BEARISH: 'Bearish',
  NEUTRAL: 'Neutral',
  NONE:    'No data',
}

// Score 0..1 to a mood label
export function moodFromScore(score) {
  if (score === null || score === undefined || Number.isNaN(score)) return MOOD.NONE
  if (score >= 0.6) return MOOD.BULLISH
  if (score <= 0.4) return MOOD.BEARISH
  return MOOD.NEUTRAL
}

// Mood or prediction label to its CSS class (see theme.css)
export function toneClass(label) {
  if (!label) return 'is-none'
  if (label.includes('Bullish') || label.includes('Positive')) return 'is-bullish'
  if (label.includes('Bearish') || label.includes('Negative')) return 'is-bearish'
  if (label.includes('Neutral')) return 'is-neutral'
  return 'is-none'
}

// ─── Filtering & sorting (FR-06, FR-09), client-side ──────────

export const ASSET_TYPES = ['All', 'Stock', 'ETF', 'Crypto']

export const SORT_OPTIONS = [
  { id: 'symbol',         label: 'Symbol (A-Z)' },
  { id: 'sentiment-desc', label: 'Sentiment (high to low)' },
  { id: 'sentiment-asc',  label: 'Sentiment (low to high)' },
  { id: 'prediction',     label: 'Predicted movement' },
  { id: 'price-desc',     label: 'Price (high to low)' },
  { id: 'price-asc',      label: 'Price (low to high)' },
]

// Match on ticker, name or type
export function filterAssets(assets, { query = '', type = 'All' } = {}) {
  const q = query.trim().toLowerCase()

  return assets.filter(asset => {
    if (type !== 'All' && asset.type !== type) return false
    if (!q) return true
    return asset.symbol.toLowerCase().includes(q)
        || asset.name.toLowerCase().includes(q)
  })
}

// Nulls always sort last, in both directions
function compareNullable(x, y, direction) {
  if (x === null && y === null) return 0
  if (x === null) return 1
  if (y === null) return -1
  return direction === 'asc' ? x - y : y - x
}

const PREDICTION_RANK = { Positive: 0, Neutral: 1, Negative: 2 }

function rankPrediction(asset) {
  const rank = PREDICTION_RANK[asset.prediction]
  return rank === undefined ? Number.MAX_SAFE_INTEGER : rank
}

// Ties break on symbol so the order is stable
export function sortAssets(assets, sortId) {
  const bySymbol = (a, b) => a.symbol.localeCompare(b.symbol)
  const list = [...assets]

  switch (sortId) {
    case 'sentiment-desc':
      return list.sort((a, b) =>
        compareNullable(a.sentimentScore, b.sentimentScore, 'desc') || bySymbol(a, b))

    case 'sentiment-asc':
      return list.sort((a, b) =>
        compareNullable(a.sentimentScore, b.sentimentScore, 'asc') || bySymbol(a, b))

    case 'prediction':
      return list.sort((a, b) =>
        rankPrediction(a) - rankPrediction(b) || bySymbol(a, b))

    case 'price-desc':
      return list.sort((a, b) =>
        compareNullable(a.price, b.price, 'desc') || bySymbol(a, b))

    case 'price-asc':
      return list.sort((a, b) =>
        compareNullable(a.price, b.price, 'asc') || bySymbol(a, b))

    default:
      return list.sort(bySymbol)
  }
}

export function summarise(assets) {
  const count = mood => assets.filter(a => a.mood === mood).length
  const bullish = count(MOOD.BULLISH)
  const bearish = count(MOOD.BEARISH)
  const neutral = count(MOOD.NEUTRAL)

  let overallMood = MOOD.NONE
  if (bullish || bearish || neutral) {
    overallMood = bullish >= bearish && bullish >= neutral ? MOOD.BULLISH
                : bearish >= neutral                       ? MOOD.BEARISH
                :                                            MOOD.NEUTRAL
  }

  return {
    overallMood,
    total:   assets.length,
    bullish,
    bearish,
    neutral,
    noData:  count(MOOD.NONE),
  }
}

// ─── Portfolio ────────────────────────────────────────────────

// Adds cost, value and profit to a holding. `price` is the live price;
// when it is missing the holding is worth what was paid for it.
export function priceHolding(holding, price) {
  const cost  = holding.quantity * holding.buyPrice
  const value = price === null || price === undefined ? null : holding.quantity * price

  return {
    ...holding,
    price: price ?? null,
    cost,
    value,
    profit:        value === null ? null : value - cost,
    profitPercent: value === null || cost === 0 ? null : ((value - cost) / cost) * 100,
  }
}

// Totals across the holdings that have a live price
export function summarisePortfolio(holdings) {
  const priced = holdings.filter(h => h.value !== null)

  const cost   = priced.reduce((sum, h) => sum + h.cost, 0)
  const value  = priced.reduce((sum, h) => sum + h.value, 0)
  const profit = value - cost

  return {
    holdings: holdings.length,
    priced:   priced.length,
    cost,
    value,
    profit:        priced.length ? profit : null,
    profitPercent: cost === 0 ? null : (profit / cost) * 100,
  }
}

// AssetView with every field defaulted, so the UI never sees undefined
export function emptyAsset(partial) {
  return {
    symbol:         '',
    name:           '',
    type:           'Stock',
    market:         '—',
    price:          null,
    priceDirection: MOOD.NONE,
    mood:           MOOD.NONE,
    sentimentScore: null,
    prediction:     null,
    addedAt:        null,
    ...partial,
  }
}
