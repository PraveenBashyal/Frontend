import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import MetricCard from '../components/ui/MetricCard'
import MoodBadge from '../components/ui/MoodBadge'
import AssetRow from '../components/ui/AssetRow'
import AssetControls from '../components/ui/AssetControls'
import { fetchMarketOverview, toneClass, filterAssets, sortAssets } from '../data'

const COLUMNS = '2fr 1fr 1fr 1fr 1fr'

export default function DashboardPage() {
  const navigate = useNavigate()

  const [assets,  setAssets]  = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [query, setQuery] = useState('')
  const [type,  setType]  = useState('All')
  const [sort,  setSort]  = useState('symbol')

  // Recomputed locally, no refetch
  const visible = useMemo(
    () => sortAssets(filterAssets(assets, { query, type }), sort),
    [assets, query, type, sort]
  )

  // Nothing before the first await calls setState, to avoid a cascading
  // render when this is called from useEffect.
  const loadData = useCallback(async () => {
    try {
      const { assets, summary } = await fetchMarketOverview()
      setAssets(assets)
      setSummary(summary)
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
    <Layout>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-sub">Market sentiment overview</div>
      </div>

      {error && <div className="state-error">{error}</div>}

      <div className="metric-row">
        <MetricCard
          title="Overall Mood"
          value={summary.overallMood || '—'}
          subtitle={`${summary.total || 0} assets tracked`}
          tone={toneClass(summary.overallMood)}
        />
        <MetricCard
          title="Bullish"
          value={summary.bullish ?? '—'}
          subtitle="Positive sentiment"
          tone="is-bullish"
        />
        <MetricCard
          title="Bearish"
          value={summary.bearish ?? '—'}
          subtitle="Negative sentiment"
          tone="is-bearish"
        />
        <MetricCard
          title="Neutral"
          value={summary.neutral ?? '—'}
          subtitle="Stable sentiment"
          tone="is-neutral"
        />
        <MetricCard
          title="No Data"
          value={summary.noData ?? '—'}
          subtitle="Awaiting analysis"
          tone="is-none"
        />
      </div>

      <div className="table__caption">
        <div className="section-title">All Assets</div>
        <div className="table__count">
          {visible.length === assets.length
            ? `${assets.length} assets`
            : `${visible.length} of ${assets.length} assets`}
        </div>
      </div>

      <AssetControls
        tourId="dashboard-controls"
        query={query} onQuery={setQuery}
        type={type}   onType={setType}
        sort={sort}   onSort={setSort}
      />

      {loading ? (
        <div className="state-loading">Loading assets...</div>
      ) : (
        <div className="panel panel--flush">
          <div className="table__head" style={{ '--cols': COLUMNS }}>
            <div>Asset</div>
            <div>Price</div>
            <div>Market</div>
            <div>Mood</div>
            <div>Prediction</div>
          </div>

          {visible.length === 0 ? (
            <div className="state-empty-row">
              {assets.length === 0
                ? 'No assets found'
                : 'No assets match the current filter'}
            </div>
          ) : (
            visible.map((asset, index) => (
              <AssetRow
                key={asset.symbol || index}
                asset={asset}
                columns={COLUMNS}
                onClick={() => navigate(`/stock/${asset.symbol}`)}
              >
                <div className="asset-row__market">{asset.market}</div>
                <div>
                  <MoodBadge mood={asset.mood} />
                </div>
                <div className={`prediction ${toneClass(asset.prediction)}`}>
                  {asset.prediction || 'No prediction yet'}
                </div>
              </AssetRow>
            ))
          )}
        </div>
      )}
    </Layout>
  )
}
