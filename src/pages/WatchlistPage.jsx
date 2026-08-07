import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import MoodBadge from '../components/ui/MoodBadge'
import AssetRow from '../components/ui/AssetRow'
import AssetControls from '../components/ui/AssetControls'
import { fetchWatchlist, removeFromWatchlist, filterAssets, sortAssets } from '../data'

const COLUMNS = '2fr 1fr 1fr 1fr 120px'

export default function WatchlistPage() {
  const navigate = useNavigate()

  const [watchlist, setWatchlist] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [removing,  setRemoving]  = useState(null)

  const [query, setQuery] = useState('')
  const [type,  setType]  = useState('All')
  const [sort,  setSort]  = useState('sentiment-desc')

  const visible = useMemo(
    () => sortAssets(filterAssets(watchlist, { query, type }), sort),
    [watchlist, query, type, sort]
  )

  // See the note in DashboardPage
  const loadWatchlist = useCallback(async () => {
    try {
      setWatchlist(await fetchWatchlist())
      setError(null)
    } catch (err) {
      setError(`Failed to load watchlist: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- see DashboardPage
  useEffect(() => { loadWatchlist() }, [loadWatchlist])

  async function handleRemove(symbol) {
    try {
      setRemoving(symbol)
      await removeFromWatchlist(symbol)
      setWatchlist(prev => prev.filter(item => item.symbol !== symbol))
    } catch (err) {
      setError(`Failed to remove ${symbol}: ${err.message}`)
    } finally {
      setRemoving(null)
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <div className="page-title">My Watchlist</div>
        <div className="page-sub">Assets you are tracking</div>
      </div>

      {error && <div className="state-error">{error}</div>}

      {loading ? (
        <div className="state-loading">Loading watchlist...</div>
      ) : watchlist.length === 0 ? (
        <div className="state-empty state-empty--tall">
          <div className="state-empty__title">Your watchlist is empty</div>
          <div className="state-empty__hint">
            Search for an asset and click "Add to Watchlist"
          </div>
          <button
            className="btn btn--primary"
            onClick={() => navigate('/InvestorDashboard')}
          >
            Browse Assets
          </button>
        </div>
      ) : (
        <>
          {watchlist.length > 1 && (
            <AssetControls
              query={query} onQuery={setQuery}
              type={type}   onType={setType}
              sort={sort}   onSort={setSort}
            />
          )}

          <div className="panel panel--flush">
            <div className="table__head" style={{ '--cols': COLUMNS }}>
              <div>Asset</div>
              <div>Price</div>
              <div>Mood</div>
              <div>Added</div>
              <div>Action</div>
            </div>

            {visible.length === 0 ? (
              <div className="state-empty-row">
                No assets match the current filter
              </div>
            ) : visible.map((item, index) => (
              <AssetRow
                key={item.symbol || index}
                asset={item}
                columns={COLUMNS}
                onClick={() => navigate(`/stock/${item.symbol}`)}
              >
                <div>
                  <MoodBadge mood={item.mood} />
                </div>
                <div className="asset-row__date">
                  {item.addedAt
                    ? new Date(item.addedAt).toLocaleDateString()
                    : '—'}
                </div>
                <div>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleRemove(item.symbol)}
                    disabled={removing === item.symbol}
                  >
                    {removing === item.symbol ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </AssetRow>
            ))}
          </div>

          <div className="table__footnote">
            {visible.length === watchlist.length
              ? `${watchlist.length} asset${watchlist.length !== 1 ? 's' : ''} in watchlist`
              : `${visible.length} of ${watchlist.length} shown`}
          </div>
        </>
      )}
    </Layout>
  )
}
