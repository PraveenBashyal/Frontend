import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchPortfolio,
  addHolding,
  removeHolding,
} from "../../lib/portfolio";

const EMPTY_ENTRY = {
  symbol: "",
  quantity: "",
  buyPrice: "",
  buyDate: "",
};

const money = (value) =>
  value === null || value === undefined
    ? "—"
    : `$${Number(value).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })}`;

const percent = (value) =>
  value === null || value === undefined
    ? "—"
    : `${value >= 0 ? "+" : ""}${Number(value).toFixed(2)}%`;

const shortDate = (iso) => {
  const [y, m, d] = String(iso || "").split("-");
  return y ? `${d}/${m}/${y}` : "—";
};

const toneOf = (value) =>
  value === null || value === undefined
    ? ""
    : value > 0
    ? "value-up"
    : value < 0
    ? "value-down"
    : "";

export default function PortfolioPage() {
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [entry, setEntry] = useState(EMPTY_ENTRY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Nothing before the first await calls setState, to avoid a cascading
  // render when this is called from useEffect.
  const loadData = useCallback(async () => {
    try {
      const data = await fetchPortfolio();
      setHoldings(data.holdings);
      setSummary(data.summary);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Disabled because the rule follows the call graph and flags loadData
  // even though its setState calls all happen after an await.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function handleAdd(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError(null);
      await addHolding(entry);
      setEntry(EMPTY_ENTRY);
      await loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    try {
      setBusyId(id);
      await removeHolding(id);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const update = (field, value) =>
    setEntry((previous) => ({
      ...previous,
      [field]: value,
    }));

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div className="dashboard-welcome">
          <p className="eyebrow">Your holdings</p>

          <h1>Portfolio</h1>

          <p className="dashboard-subtitle">
            What you bought, what it is worth now, and the difference.
            Prices update every time this page loads.
          </p>
        </div>
      </section>

      <section className="portfolio-summary">
        <article className="side-card portfolio-stat">
          <p className="eyebrow">Total value</p>
          <strong>{money(summary.value)}</strong>
          <span>
            {summary.holdings || 0} holding
            {summary.holdings === 1 ? "" : "s"}
          </span>
        </article>

        <article className="side-card portfolio-stat">
          <p className="eyebrow">Total cost</p>
          <strong>{money(summary.cost)}</strong>
          <span>Amount invested</span>
        </article>

        <article className="side-card portfolio-stat">
          <p className="eyebrow">Profit / loss</p>
          <strong className={toneOf(summary.profit)}>
            {money(summary.profit)}
          </strong>
          <span className={toneOf(summary.profit)}>
            {percent(summary.profitPercent)}
          </span>
        </article>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="dashboard-section portfolio-form-card">
        <h2>Add a purchase</h2>

        <form className="portfolio-form" onSubmit={handleAdd}>
          <label>
            Symbol
            <input
              value={entry.symbol}
              onChange={(e) => update("symbol", e.target.value)}
              placeholder="AAPL"
            />
          </label>

          <label>
            Quantity
            <input
              type="number"
              step="any"
              min="0"
              value={entry.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              placeholder="10"
            />
          </label>

          <label>
            Buy price
            <input
              type="number"
              step="any"
              min="0"
              value={entry.buyPrice}
              onChange={(e) => update("buyPrice", e.target.value)}
              placeholder="198.40"
            />
          </label>

          <label>
            Buy date
            <input
              type="date"
              value={entry.buyDate}
              onChange={(e) => update("buyDate", e.target.value)}
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add"}
          </button>
        </form>

        {formError && <p className="form-error">{formError}</p>}
      </section>

      {loading ? (
        <p className="portfolio-message">Loading portfolio...</p>
      ) : holdings.length === 0 ? (
        <div className="asset-empty-state portfolio-empty">
          <h3>Nothing here yet</h3>
          <p>
            Add a purchase above and this page will track what it is
            worth.
          </p>
        </div>
      ) : (
        <section className="portfolio-list">
          {holdings.map((holding) => (
            <article className="side-card portfolio-row" key={holding.id}>
              <div
                className="portfolio-asset clickable-asset"
                onClick={() => navigate(`/stock/${holding.symbol}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/stock/${holding.symbol}`);
                  }
                }}
              >
                <strong>{holding.symbol}</strong>
                <span>{holding.name}</span>
                {holding.type && <small>{holding.type}</small>}
              </div>

              <dl className="portfolio-figures">
                <div>
                  <dt>Quantity</dt>
                  <dd>{holding.quantity}</dd>
                </div>

                <div>
                  <dt>Buy price</dt>
                  <dd>{money(holding.buyPrice)}</dd>
                </div>

                <div>
                  <dt>Bought</dt>
                  <dd>{shortDate(holding.buyDate)}</dd>
                </div>

                <div>
                  <dt>Now</dt>
                  <dd>{money(holding.price)}</dd>
                </div>

                <div>
                  <dt>Value</dt>
                  <dd>{money(holding.value)}</dd>
                </div>

                <div>
                  <dt>Profit / loss</dt>
                  <dd className={toneOf(holding.profit)}>
                    {money(holding.profit)}{" "}
                    <small>{percent(holding.profitPercent)}</small>
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                className="portfolio-remove-button"
                onClick={() => handleRemove(holding.id)}
                disabled={busyId === holding.id}
              >
                {busyId === holding.id ? "..." : "Remove"}
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
