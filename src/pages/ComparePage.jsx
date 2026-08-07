import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import MoodBadge from '../components/ui/MoodBadge'
import CompareChart from '../components/charts/CompareChart'
import { fetchAssetDetail, searchAssets, toneClass } from '../data'

// Rows of the side-by-side table. `better` decides which side gets the
// win marker; null means the row is not a contest.
const ROWS = [
  { label: 'Price',      get: a => a.price,          format: v => v === null ? '—' : `$${v.toLocaleString()}`, better: null },
  { label: 'Direction',  get: a => a.priceDirection, format: v => v,                                           better: null },
  { label: 'Mood',       get: a => a.mood,           format: v => v,                                           better: null },
  { label: 'Sentiment',  get: a => a.sentimentScore, format: v => v === null ? '—' : v.toFixed(2),             better: 'high' },
  { label: 'Prediction', get: a => a.prediction,     format: v => v || '—',                                    better: null },
  { label: 'Market',     get: a => a.market,         format: v => v,                                           better: null },
]

function Picker({ side, value, onPick }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)

  // Every setState sits inside the timer callback, never in the effect body
  useEffect(() => {
    const q = query.trim()
    let cancelled = false

    const timer = setTimeout(async () => {
      if (!q) {
        if (!cancelled) setResults([])
        return
      }
      try {
        const found = await searchAssets(q)
        if (!cancelled) setResults(found.slice(0, 6))
      } catch {
        if (!cancelled) setResults([])
      }
    }, q ? 250 : 0)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  return (
    <div className="compare__picker">
      <div className="compare__picker-label">{side}</div>

      <div className="search">
        <div className={`search__box${open && results.length ? ' search__box--open' : ''}`}>
          <input
            className="search__input"
            value={query}
            placeholder={value || 'Search a symbol...'}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => setOpen(true)}
          />
        </div>

        {open && results.length > 0 && (
          <div className="search__dropdown">
            {results.map(asset => (
              <div
                key={asset.symbol}
                className="search__item"
                onMouseDown={() => { onPick(asset.symbol); setQuery(''); setOpen(false) }}
              >
                <div className="symbol-avatar symbol-avatar--sm">{asset.symbol[0]}</div>
                <div className="search__meta">
                  <div className="search__symbol">{asset.symbol}</div>
                  <div className="subtext">{asset.name} · {asset.type}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const symbolA = params.get('a') || ''
  const symbolB = params.get('b') || ''

  const [assetA, setAssetA] = useState(null)
  const [assetB, setAssetB] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Nothing before the first await calls setState, to avoid a cascading
  // render when this is called from useEffect.
  const loadData = useCallback(async () => {
    if (!symbolA || !symbolB) {
      setAssetA(null)
      setAssetB(null)
      return
    }

    setLoading(true)
    try {
      const [a, b] = await Promise.all([
        fetchAssetDetail(symbolA),
        fetchAssetDetail(symbolB),
      ])
      setAssetA(a)
      setAssetB(b)
      setError(null)
    } catch (err) {
      setError(`Could not load the comparison: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [symbolA, symbolB])

  // Disabled because the rule follows the call graph and flags loadData
  // even though its setState calls all happen after an await.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [loadData])

  function pick(side, symbol) {
    const next = new URLSearchParams(params)
    next.set(side, symbol)
    setParams(next, { replace: true })
  }

  const ready = assetA && assetB

  return (
    <Layout>
      <div className="page-header page-header--split">
        <div>
          <h1 className="page-title">Compare</h1>
          <div className="subtext">
            Two assets side by side. Prices are rebased to percent change so
            they stay comparable.
          </div>
        </div>

        {ready && (
          <button className="btn btn--outline btn--sm" onClick={() => navigate(`/stock/${symbolA}`)}>
            Back to {symbolA}
          </button>
        )}
      </div>

      <div className="compare__pickers">
        <Picker side="First asset"  value={symbolA} onPick={s => pick('a', s)} />
        <Picker side="Second asset" value={symbolB} onPick={s => pick('b', s)} />
      </div>

      {error && <div className="state-error">{error}</div>}

      {!symbolA || !symbolB ? (
        <div className="state-empty">
          Choose two assets above to compare them.
        </div>
      ) : loading ? (
        <div className="state-loading">Loading comparison...</div>
      ) : ready ? (
        <>
          <div className="panel compare__table">
            <div className="compare__row compare__row--head">
              <div />
              <div className="compare__name">
                <span className="symbol-avatar symbol-avatar--sm">{assetA.symbol[0]}</span>
                {assetA.symbol}
              </div>
              <div className="compare__name">
                <span className="symbol-avatar symbol-avatar--sm">{assetB.symbol[0]}</span>
                {assetB.symbol}
              </div>
            </div>

            {ROWS.map(row => {
              const va = row.get(assetA)
              const vb = row.get(assetB)

              // Only mark a winner when both sides have a number
              let winner = null
              if (row.better === 'high' && typeof va === 'number' && typeof vb === 'number') {
                winner = va === vb ? null : va > vb ? 'a' : 'b'
              }

              const cell = (value, side) => {
                const text = row.format(value)
                const isMood = row.label === 'Mood'
                return (
                  <div className={`compare__cell${winner === side ? ' compare__cell--win' : ''}`}>
                    {isMood
                      ? <MoodBadge mood={value} />
                      : <span className={row.label === 'Direction' ? toneClass(value) : undefined}>{text}</span>}
                  </div>
                )
              }

              return (
                <div key={row.label} className="compare__row">
                  <div className="compare__label">{row.label}</div>
                  {cell(va, 'a')}
                  {cell(vb, 'b')}
                </div>
              )
            })}
          </div>

          <CompareChart
            title="Price, rebased to % change"
            seriesA={assetA.priceHistory} seriesB={assetB.priceHistory}
            labelA={assetA.symbol}        labelB={assetB.symbol}
            timeKey="recordedAt" valueKey="price" mode="percent"
          />

          <CompareChart
            title="Sentiment score"
            seriesA={assetA.sentimentHistory} seriesB={assetB.sentimentHistory}
            labelA={assetA.symbol}           labelB={assetB.symbol}
            timeKey="analysedAt" valueKey="value" mode="raw"
          />
        </>
      ) : null}
    </Layout>
  )
}
