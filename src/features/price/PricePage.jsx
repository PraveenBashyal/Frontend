import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchCompareAsset } from "../../lib/market";

import AssetActions from "../browse/AssetActions";

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return Number(value).toFixed(2);
}

function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(
    Number(value)
  );
}

export default function PricePage() {
  const { symbol } = useParams();

  const [marketData, setMarketData] =
    useState(null);

  const [selectedRange, setSelectedRange] =
    useState("1mo");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;

    const show = (asset) => {
      if (cancelled) return;

      setMarketData(asset);
      setErrorMessage(asset ? "" : "Could not load prices for this asset.");
      setLoading(false);
    };

    fetchCompareAsset(symbol, selectedRange)
      .then(show)
      .catch(() => show(null));

    return () => {
      cancelled = true;
    };
  }, [symbol, selectedRange]);

  const visibleChartData = useMemo(
    () =>
      (marketData?.history || []).map((point) => ({
        date: new Date(point.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        close: point.price,
      })),
    [marketData]
  );

  if (loading) {
    return (
      <main className="stock-detail-page price-page">
        <p className="eyebrow">
          MARKET DETAILS
        </p>

        <h1>
          Loading {symbol?.toUpperCase()}...
        </h1>
      </main>
    );
  }

  const candles = marketData?.history || [];
  const today = candles[candles.length - 1];

  const currentPrice = marketData?.price ?? today?.price;
  const previousClose = marketData?.previousClose;

  const dayOpen = today?.open;
  const dayHigh = marketData?.dayHigh;
  const dayLow = marketData?.dayLow;
  const dayVolume = marketData?.dayVolume;

  const priceChange =
    currentPrice !== undefined &&
    previousClose !== undefined
      ? currentPrice - previousClose
      : null;

  const priceChangePercent =
    priceChange !== null &&
    previousClose
      ? (priceChange / previousClose) * 100
      : null;

  const isPositive =
    priceChange === null ||
    priceChange >= 0;

  const companyName = marketData?.name || symbol?.toUpperCase();

  return (
    <main className="stock-detail-page price-page">
      <Link
        to="/watchlist"
        className="secondary-link"
      >
        ← Back to watchlist
      </Link>

      <section className="stock-detail-header">
        <p className="eyebrow">
          MARKET DETAILS
        </p>

        <div className="stock-title-row">
          <div>
            <p className="stock-symbol">
              {symbol?.toUpperCase()}
            </p>

            <h1>{companyName}</h1>
          </div>

          <div className="market-price-card">
            <span className="profile-label">
              Current price
            </span>

            <strong>
              {formatPrice(currentPrice)}
            </strong>

            {priceChange !== null && (
              <span
                className={
                  isPositive
                    ? "positive-change"
                    : "negative-change"
                }
              >
                {isPositive ? "+" : ""}
                {formatPrice(priceChange)}

                {priceChangePercent !== null &&
                  ` (${isPositive ? "+" : ""}${formatPrice(
                    priceChangePercent
                  )}%)`}
              </span>
            )}
          </div>
        </div>

        <AssetActions
          symbol={symbol?.toUpperCase()}
          name={companyName}
          type={marketData?.type}
        />
      </section>

      {errorMessage && (
        <p className="error-message">
          {errorMessage}
        </p>
      )}

      <section className="stock-chart-card">
        <div className="stock-section-heading">
          <div>
            <p className="eyebrow">
              PRICE HISTORY
            </p>

            <h2>Stock performance</h2>
          </div>

          <div className="chart-range-buttons">

            {[
              { key: "1w", label: "1W" },
              { key: "1mo", label: "1M" },
            ].map((range) => (
              <button
                type="button"
                className={
                  selectedRange === range.key
                    ? "chart-range active"
                    : "chart-range"
                }
                key={range.key}
                onClick={() =>
                  setSelectedRange(range.key)
                }
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {visibleChartData.length > 0 ? (
          <div className="stock-chart-visual">
            <ResponsiveContainer
              width="100%"
              height={350}
            >
              <LineChart
                data={visibleChartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />

                <XAxis
                  dataKey="date"
                  stroke="var(--muted)"
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="var(--muted)"
                  tick={{ fontSize: 11 }}
                  domain={["auto", "auto"]}
                />

                <Tooltip
                  contentStyle={{
                    border:
                      "1px solid var(--border)",
                    borderRadius: "10px",
                    background:
                      "var(--panel)",
                    color: "var(--text)",
                  }}
                  formatter={(value) => [
                    formatPrice(value),
                    "Price",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="var(--green)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-chart">
            <p>
              No historical chart data is available.
            </p>
          </div>
        )}
      </section>

      <section className="stock-stats-grid">

        <div className="stock-stat-card">
          <span>Open</span>
          <strong>
            {formatPrice(dayOpen)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Day high</span>
          <strong>
            {formatPrice(dayHigh)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Day low</span>
          <strong>
            {formatPrice(dayLow)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Previous close</span>
          <strong>
            {formatPrice(previousClose)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Volume</span>
          <strong>
            {formatNumber(dayVolume)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Currency</span>
          <strong>
            {marketData?.currency || "USD"}
          </strong>
        </div>
      </section>

    </main>
  );
}
