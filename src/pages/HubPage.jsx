import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchWatchlist, fetchAlerts } from '../data'
import { useAuth } from '../api/AuthContext'
import AssetRow from '../components/ui/AssetRow'
import { OPEN_CHAT } from '../components/ui/ChatPanel'

const PREVIEW_COUNT = 4
const COLUMNS = 'minmax(0, 2fr) minmax(0, 1fr)'

// Landing screen after signing in. The layout comes from the other
// frontend; the contents are this app's own components and data.
export default function HubPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [watchlist, setWatchlist] = useState([])
  const [unread,    setUnread]    = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const displayName = user?.Name || user?.name || user?.sub || user?.username || 'Investor'

  // Nothing before the first await calls setState, to avoid a cascading
  // render when this is called from useEffect.
  const loadData = useCallback(async () => {
    try {
      const [assets, alerts] = await Promise.all([
        fetchWatchlist(),
        fetchAlerts().catch(() => []),
      ])
      setWatchlist(assets)
      setUnread(alerts.filter(alert => !alert.read).length)
      setError(null)
    } catch (err) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // Disabled because the rule follows the call graph and flags loadData
  // even though its setState calls all happen after an await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  return (
    <main className="entry-page hub-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">YOUR MARKET WORKSPACE</p>

          <h1>
            Welcome back,
            <br />
            {displayName}.
          </h1>

          <p className="dashboard-subtitle">
            Follow the market, discover opportunities, and keep your
            watchlist organised.
          </p>
        </div>

        <Link className="dashboard-action" to="/InvestorDashboard">
          Explore markets
        </Link>
      </section>

      {error && <div className="state-error">{error}</div>}

      <section className="dashboard-content">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">MARKET ALERTS</p>
            <h2>Stay informed</h2>
          </div>

          <button
            type="button"
            className="alert-settings-button"
            onClick={() => navigate('/alerts')}
          >
            Alert settings
          </button>
        </div>

        <div className="alert-panel">
          <div className="alert-panel-figure">{unread}</div>

          <div className="alert-panel-content">
            <h3>Sentiment shift alerts</h3>

            <p>
              You are notified when an asset on your watchlist changes
              mood, so you can react before the move is priced in.
            </p>

            <span className="alert-status">
              {unread > 0
                ? `${unread} unread alert${unread === 1 ? '' : 's'}`
                : 'No unread alerts'}
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">YOUR ASSETS</p>
            <h2>Watchlist</h2>
          </div>

          <Link to="/UserWatchList">View full watchlist</Link>
        </div>

        {loading ? (
          <div className="state-loading">Loading watchlist...</div>
        ) : watchlist.length === 0 ? (
          <div className="state-empty">
            Nothing saved yet. Explore markets to add your first asset.
          </div>
        ) : (
          <div className="panel panel--flush">
            {watchlist.slice(0, PREVIEW_COUNT).map(asset => (
              <AssetRow
                key={asset.symbol}
                asset={asset}
                columns={COLUMNS}
                onClick={() => navigate(`/stock/${asset.symbol}`)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-content">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">ASSISTANT</p>
            <h2>AI market assistant</h2>
          </div>
        </div>

        <div className="ai-panel">
          <div className="ai-panel-figure">AI</div>

          <div>
            <h3>Ask about what the data shows</h3>

            <p>
              Questions about sentiment, predictions and headlines are
              answered from the data already collected for your assets.
            </p>

            <button
              type="button"
              className="alert-settings-button"
              onClick={() => window.dispatchEvent(new Event(OPEN_CHAT))}
            >
              Open assistant
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
