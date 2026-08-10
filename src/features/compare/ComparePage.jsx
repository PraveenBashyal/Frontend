import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { fetchAssetDetail, searchAssets } from "../../lib/market";
import CompareChart from "./CompareChart";

// Rows of the side-by-side table. `better` decides which side gets the
// win marker; null means the row is not a contest.
const ROWS = [
  { label: "Price",     get: (a) => a.price,         format: (v) => (v === null ? "—" : `$${v.toLocaleString()}`), better: "high" },
  { label: "Today",     get: (a) => a.changePercent, format: (v) => (v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`), better: "high" },
  { label: "Type",      get: (a) => a.type,          format: (v) => v || "—", better: null },
  { label: "Market",    get: (a) => a.market,        format: (v) => v || "—", better: null },
  { label: "Sentiment", get: (a) => a.sentimentScore, format: (v) => (v === null ? "Not available" : v.toFixed(2)), better: "high" },
];

function Picker({ side, value, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  // Every setState sits inside the timer callback, never in the effect body
  useEffect(() => {
    const q = query.trim();
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (!q) {
        if (!cancelled) setResults([]);
        return;
      }
      try {
        const found = await searchAssets(q);
        if (!cancelled) setResults(found);
      } catch {
        if (!cancelled) setResults([]);
      }
    }, q ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="compare-picker">
      <p className="eyebrow">{side}</p>

      <input
        value={query}
        placeholder={value || "Search a symbol..."}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {/* A placeholder reads as a hint, not a choice, which matters when
          this page is opened from an asset with one side already set. */}
      {value && (
        <p className="compare-picked">
          Selected <strong>{value}</strong>
        </p>
      )}

      {open && results.length > 0 && (
        <ul className="compare-results">
          {results.map((asset) => (
            <li key={`${asset.type}-${asset.symbol}`}>
              <button
                type="button"
                onMouseDown={() => {
                  onPick(asset.symbol);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <strong>{asset.symbol}</strong>
                <span>{asset.name}</span>
                <small>{asset.type}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const symbolA = params.get("a") || "";
  const symbolB = params.get("b") || "";

  const [assetA, setAssetA] = useState(null);
  const [assetB, setAssetB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Nothing before the first await calls setState, to avoid a cascading
  // render when this is called from useEffect.
  const loadData = useCallback(async () => {
    if (!symbolA || !symbolB) {
      setAssetA(null);
      setAssetB(null);
      return;
    }

    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        fetchAssetDetail(symbolA),
        fetchAssetDetail(symbolB),
      ]);
      setAssetA(a);
      setAssetB(b);
      setError(null);
    } catch (err) {
      setError(`Could not load the comparison: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [symbolA, symbolB]);

  // Disabled because the rule follows the call graph and flags loadData
  // even though its setState calls all happen after an await.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  function pick(side, symbol) {
    const next = new URLSearchParams(params);
    next.set(side, symbol);
    setParams(next, { replace: true });
  }

  const ready = assetA && assetB;

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div className="dashboard-welcome">
          <p className="eyebrow">Side by side</p>

          <h1>Compare</h1>

          <p className="dashboard-subtitle">
            Two assets next to each other. Prices are rebased to percent
            change so a $200 stock and a $90,000 coin stay comparable.
          </p>
        </div>

        {ready && (
          <div className="dashboard-header-actions">
            <button
              type="button"
              className="outline-button"
              onClick={() => navigate(`/stock/${symbolA}`)}
            >
              Open {symbolA}
            </button>
          </div>
        )}
      </section>

      <section className="compare-pickers">
        <Picker side="First asset" value={symbolA} onPick={(s) => pick("a", s)} />
        <Picker side="Second asset" value={symbolB} onPick={(s) => pick("b", s)} />
      </section>

      {error && <p className="form-error">{error}</p>}

      {!symbolA || !symbolB ? (
        <div className="asset-empty-state portfolio-empty">
          <h3>Pick two assets</h3>
          <p>Search above to choose what to compare.</p>
        </div>
      ) : loading ? (
        <p className="portfolio-message">Loading comparison...</p>
      ) : ready ? (
        <>
          <section className="dashboard-section compare-table">
            <div className="compare-row compare-row-head">
              <span />
              <strong>{assetA.symbol}</strong>
              <strong>{assetB.symbol}</strong>
            </div>

            {ROWS.map((row) => {
              const va = row.get(assetA);
              const vb = row.get(assetB);

              // Only mark a winner when both sides have a number
              let winner = null;
              if (
                row.better === "high" &&
                typeof va === "number" &&
                typeof vb === "number"
              ) {
                winner = va === vb ? null : va > vb ? "a" : "b";
              }

              return (
                <div className="compare-row" key={row.label}>
                  <span className="compare-label">{row.label}</span>

                  <span className={winner === "a" ? "compare-win" : ""}>
                    {row.format(va)}
                  </span>

                  <span className={winner === "b" ? "compare-win" : ""}>
                    {row.format(vb)}
                  </span>
                </div>
              );
            })}
          </section>

          <CompareChart
            title="Price, rebased to % change"
            seriesA={assetA.priceHistory}
            seriesB={assetB.priceHistory}
            labelA={assetA.symbol}
            labelB={assetB.symbol}
          />
        </>
      ) : null}
    </main>
  );
}
