import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import {
  fetchAlerts, dismissAlert, clearAlerts, markAlertsRead, toneClass
} from '../data'

// Describes the shift from previousMood to mood
function describeShift(alert) {
  const { mood, previousMood } = alert

  if (previousMood && previousMood !== mood) {
    return `Sentiment shifted from ${previousMood} to ${mood}`
  }
  if (mood === 'Bullish') return 'Significant positive sentiment detected'
  if (mood === 'Bearish') return 'Growing negative sentiment detected'
  if (mood === 'Neutral') return 'Sentiment is currently stable'
  return 'Sentiment changed'
}

function AlertCard({ alert, onView, onDismiss, dismissing }) {
  const tone = toneClass(alert.mood)

  return (
    <div className={`alert-card ${tone}${dismissing ? ' alert-card--busy' : ''}`}>
      {/* First letter of the symbol */}
      <div className="alert-card__avatar">{alert.symbol?.[0]}</div>

      <div className="alert-card__body">
        <div className="alert-card__top">
          <div className="alert-card__symbol">
            {!alert.read && <span className="alert-card__unread" />}
            {alert.symbol}
            <span className="alert-card__asset">
              {alert.name} · {alert.type}
            </span>
          </div>
          <div className="alert-card__time">
            {new Date(alert.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="alert-card__message">{describeShift(alert)}</div>

        <div className="alert-card__tags">
          <span className={`badge ${tone}`}>{alert.mood}</span>
          {alert.sentimentScore !== null && (
            <span className="alert-card__score">
              Score:{' '}
              <span className="score-pill__value">
                {alert.sentimentScore.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="alert-card__actions">
        <button
          className="btn btn--ghost-primary btn--xs"
          onClick={() => onView(alert.symbol)}
        >
          View
        </button>
        <button
          className="btn btn--ghost-dim btn--xs"
          onClick={() => onDismiss(alert.id)}
          disabled={dismissing}
        >
          {dismissing ? 'Removing...' : 'Dismiss'}
        </button>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const navigate = useNavigate()

  const [alerts,     setAlerts]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [dismissing, setDismissing] = useState(null)
  const [clearing,   setClearing]   = useState(false)

  // See the note in DashboardPage
  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts()
      setAlerts(data)
      setError(null)
      // Opening the page marks them read, clearing the sidebar dot
      await markAlertsRead()
    } catch (err) {
      setError(`Failed to load alerts: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAlerts() }, [loadAlerts])

  async function handleDismiss(id) {
    try {
      setDismissing(id)
      await dismissAlert(id)
      setAlerts(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      setError(`Failed to dismiss alert: ${err.message}`)
    } finally {
      setDismissing(null)
    }
  }

  async function handleClearAll() {
    try {
      setClearing(true)
      await clearAlerts()
      setAlerts([])
    } catch (err) {
      setError(`Failed to clear alerts: ${err.message}`)
    } finally {
      setClearing(false)
    }
  }

  const filtered = alerts.filter(a =>
    a.symbol.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="page-header page-header--split">
        <div>
          <div className="page-title">Sentiment Alerts</div>
          <div className="page-sub">
            Notifications when market sentiment shifts
          </div>
        </div>

        {alerts.length > 0 && (
          <button
            className="btn btn--danger"
            onClick={handleClearAll}
            disabled={clearing}
          >
            {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>

      {error && <div className="state-error">{error}</div>}

      {alerts.length > 0 && (
        <div className="filter-input">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts..."
          />
        </div>
      )}

      {loading ? (
        <div className="state-loading">Loading alerts...</div>
      ) : filtered.length === 0 ? (
        <div className="state-empty">
          <div className="state-empty__title state-empty__title--sm">
            {search ? 'No alerts match your search' : 'No alerts yet'}
          </div>
          <div className="state-empty__hint state-empty__hint--tight">
            Alerts appear when sentiment changes significantly
          </div>
        </div>
      ) : (
        <>
          <div className="table__footnote table__footnote--flush">
            {filtered.length} alert{filtered.length !== 1 ? 's' : ''}
          </div>
          {filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              dismissing={dismissing === alert.id}
              onView={symbol => navigate(`/stock/${symbol}`)}
              onDismiss={handleDismiss}
            />
          ))}
        </>
      )}
    </Layout>
  )
}
