import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import MoodBadge from '../components/ui/MoodBadge'
import PriceChart from '../components/charts/PriceChart'
import SentimentChart from '../components/charts/SentimentChart'
import {
  fetchAssetDetail,
  fetchWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  analyzeAsset,
  toneClass,
} from '../data'

export default function StockDetailPage() {
  const { symbol } = useParams()
  const navigate = useNavigate()

  const [asset,   setAsset]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [inWatchlist,      setInWatchlist]      = useState(false)
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const [analyzing,        setAnalyzing]        = useState(false)
  const [timeFilter,       setTimeFilter]       = useState('1D')

  // See the note in DashboardPage. Changing symbol remounts the component,
  // so loading resets on its own.
  const loadData = useCallback(async () => {
    try {
      const [detail, watchlist] = await Promise.all([
        fetchAssetDetail(symbol),
        fetchWatchlist().catch(() => []),
      ])

      setAsset(detail)
      setInWatchlist(watchlist.some(item => item.symbol === symbol))
      setError(null)
    } catch (err) {
      setError(`Failed to load ${symbol}: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see DashboardPage
    if (symbol) loadData()
  }, [symbol, loadData])

  async function handleWatchlistToggle() {
    try {
      setWatchlistLoading(true)
      setError(null)

      // Re-check with the server; local state may be stale
      const watchlist = await fetchWatchlist()
      const currentlyIn = watchlist.some(item => item.symbol === symbol)

      if (currentlyIn) {
        await removeFromWatchlist(symbol)
        setInWatchlist(false)
      } else {
        await addToWatchlist(asset)
        setInWatchlist(true)
      }
    } catch (err) {
      setError(`Failed to update watchlist: ${err.message}`)
      // Resync after a failure
      try {
        const watchlist = await fetchWatchlist()
        setInWatchlist(watchlist.some(item => item.symbol === symbol))
      } catch {
        // Re-read failed too; leave the state as it is
      }
    } finally {
      setWatchlistLoading(false)
    }
  }

  async function handleAnalyze() {
    try {
      setAnalyzing(true)
      setError(null)
      await analyzeAsset(symbol)
      await loadData()
    } catch (err) {
      setError(`Analysis failed: ${err.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) return (
    <Layout>
      <div className="state-loading state-loading--page">Loading {symbol}...</div>
    </Layout>
  )

  if (error && !asset) return (
    <Layout>
      <BackButton onClick={() => navigate('/InvestorDashboard')} />
      <div className="state-error state-error--block">{error}</div>
    </Layout>
  )

  return (
    <Layout>
      <BackButton onClick={() => navigate('/InvestorDashboard')} />

      {error && <div className="state-error">{error}</div>}

      <div className="detail__header">
        <div className="detail__identity">
          <div className="symbol-avatar symbol-avatar--lg">{symbol?.[0]}</div>
          <div>
            <div className="detail__symbol">{symbol}</div>
            <div className="detail__meta">
              {asset.name !== symbol ? `${asset.name} · ` : ''}
              {asset.type} · {asset.market}
            </div>
          </div>
        </div>

        <div className="detail__price-block">
          <div className={`detail__price${asset.price === null ? ' detail__price--empty' : ''}`}>
            {asset.price === null ? '—' : `$${asset.price.toLocaleString()}`}
          </div>

          <div className="detail__actions">
            <button
              className={`btn ${inWatchlist ? 'btn--danger' : 'btn--primary'}`}
              onClick={handleWatchlistToggle}
              disabled={watchlistLoading}
            >
              {watchlistLoading ? 'Updating...'
                : inWatchlist   ? 'Remove from Watchlist'
                :                 'Add to Watchlist'}
            </button>

            <button
              className="btn btn--surface"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </button>

            <button
              className="btn btn--outline"
              onClick={() => navigate(`/compare?a=${encodeURIComponent(symbol)}`)}
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      <div className="badge-row">
        <MoodBadge mood={asset.mood} />

        <span className="pill is-purple">Price: {asset.priceDirection}</span>

        {asset.prediction && (
          <span className={`pill ${toneClass(asset.prediction)}`}>
            Prediction: {asset.prediction}
          </span>
        )}

        {asset.sentimentScore !== null && (
          <div className="score-pill">
            Sentiment Score:{' '}
            <span className="score-pill__value">
              {asset.sentimentScore.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {asset.description && (
        <div className="detail__description">{asset.description}</div>
      )}

      <div className="chart-stack" data-tour="asset-charts">
        <PriceChart
          data={asset.priceHistory}
          timeFilter={timeFilter}
          onFilterChange={setTimeFilter}
        />
        <SentimentChart data={asset.sentimentHistory} />
      </div>

      <div className="panel news">
        <div className="news__title">Latest News</div>

        {asset.news.length === 0 ? (
          <div className="state-empty-row">No news for {symbol} yet</div>
        ) : (
          asset.news.map((item, i) => (
            <div key={i} className="news__item">
              <div className="news__head">
                <span className="news__headline">{item.headline}</span>
                <span className="news__source">{item.source}</span>
              </div>
              <div className="news__summary">{item.summary}</div>
            </div>
          ))
        )}
      </div>
    </Layout>
  )
}

function BackButton({ onClick }) {
  return (
    <button className="btn btn--outline btn--back" onClick={onClick}>
      Back to Dashboard
    </button>
  )
}
