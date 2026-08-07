import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/ui/Layout'
import MetricCard from '../components/ui/MetricCard'
import {
  fetchPortfolio, addHolding, removeHolding,
  priceHolding, summarisePortfolio,
} from '../data'

const EMPTY_ENTRY = { symbol: '', quantity: '', buyPrice: '', buyDate: '' }

const money = value =>
  value === null ? '—' : `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

const percent = value =>
  value === null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

// Profit drives the colour, so gains and losses read at a glance
const profitTone = value =>
  value === null ? 'is-none' : value > 0 ? 'is-bullish' : value < 0 ? 'is-bearish' : 'is-neutral'

export default function PortfolioPage() {
  const navigate = useNavigate()

  const [holdings, setHoldings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const [entry,   setEntry]   = useState(EMPTY_ENTRY)
  const [saving,  setSaving]  = useState(false)
  const [formError, setFormError] = useState(null)
  const [busyId,  setBusyId]  = useState(null)

  // Cost, value and profit are derived, never stored
  const priced  = useMemo(() => holdings.map(h => priceHolding(h, h.price)), [holdings])
  const summary = useMemo(() => summarisePortfolio(priced), [priced])

  // Nothing before the first await calls setState, to avoid a cascading
  // render when this is called from useEffect.
  const loadData = useCallback(async () => {
    try {
      const list = await fetchPortfolio()
      setHoldings(list)
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

  async function handleAdd(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setFormError(null)
      await addHolding(entry)
      setEntry(EMPTY_ENTRY)
      await loadData()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(id) {
    try {
      setBusyId(id)
      await removeHolding(id)
      await loadData()
    } catch (err) {
      setError(`Could not remove the holding: ${err.message}`)
    } finally {
      setBusyId(null)
    }
  }

  const update = (field, value) => setEntry(prev => ({ ...prev, [field]: value }))

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Portfolio</h1>
        <div className="subtext">
          What you bought, what it is worth now, and the difference.
        </div>
      </div>

      <div className="metric-row">
        <MetricCard
          title="Total value"
          value={money(summary.value)}
          subtitle={`${summary.holdings} holding${summary.holdings === 1 ? '' : 's'}`}
          tone="is-none"
        />
        <MetricCard
          title="Total cost"
          value={money(summary.cost)}
          subtitle="Amount invested"
          tone="is-none"
        />
        <MetricCard
          title="Profit / loss"
          value={money(summary.profit)}
          subtitle={percent(summary.profitPercent)}
          tone={profitTone(summary.profit)}
        />
      </div>

      {error && <div className="state-error">{error}</div>}

      <form className="panel portfolio__form" onSubmit={handleAdd}>
        <div className="portfolio__form-title">Add a purchase</div>

        <div className="portfolio__form-grid">
          <label className="field">
            <span className="field__label">Symbol</span>
            <input
              className="field__input"
              value={entry.symbol}
              onChange={e => update('symbol', e.target.value)}
              placeholder="AAPL"
            />
          </label>

          <label className="field">
            <span className="field__label">Quantity</span>
            <input
              className="field__input" type="number" step="any" min="0"
              value={entry.quantity}
              onChange={e => update('quantity', e.target.value)}
              placeholder="10"
            />
          </label>

          <label className="field">
            <span className="field__label">Buy price</span>
            <input
              className="field__input" type="number" step="any" min="0"
              value={entry.buyPrice}
              onChange={e => update('buyPrice', e.target.value)}
              placeholder="198.40"
            />
          </label>

          <label className="field">
            <span className="field__label">Buy date</span>
            <input
              className="field__input" type="date"
              value={entry.buyDate}
              onChange={e => update('buyDate', e.target.value)}
            />
          </label>

          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Adding...' : 'Add'}
          </button>
        </div>

        {formError && <div className="state-error">{formError}</div>}
      </form>

      {loading ? (
        <div className="state-loading">Loading portfolio...</div>
      ) : priced.length === 0 ? (
        <div className="state-empty">
          No holdings yet. Add a purchase above to start tracking it.
        </div>
      ) : (
        <div className="panel panel--flush">
          <div className="portfolio__row portfolio__row--head">
            <div>Asset</div>
            <div>Quantity</div>
            <div>Buy price</div>
            <div>Bought</div>
            <div>Now</div>
            <div>Value</div>
            <div>Profit / loss</div>
            <div />
          </div>

          {priced.map(holding => (
            <div key={holding.id} className="portfolio__row">
              <div
                className="portfolio__asset"
                onClick={() => navigate(`/stock/${holding.symbol}`)}
              >
                <div className="symbol-avatar symbol-avatar--md">{holding.symbol[0]}</div>
                <div className="min-w-0">
                  <div className="asset-row__name">{holding.symbol}</div>
                  <div className="subtext">{holding.name} · {holding.type}</div>
                </div>
              </div>

              <div>{holding.quantity}</div>
              <div>{money(holding.buyPrice)}</div>
              <div className="subtext">
                {new Date(holding.buyDate).toLocaleDateString()}
              </div>
              <div>{money(holding.price)}</div>
              <div>{money(holding.value)}</div>

              <div className={profitTone(holding.profit)}>
                <div className="portfolio__profit">{money(holding.profit)}</div>
                <div className="subtext">{percent(holding.profitPercent)}</div>
              </div>

              <div>
                <button
                  className="btn btn--danger btn--xs"
                  onClick={() => handleRemove(holding.id)}
                  disabled={busyId === holding.id}
                >
                  {busyId === holding.id ? '...' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
