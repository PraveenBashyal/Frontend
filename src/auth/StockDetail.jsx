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

import { getData, getTitle } from "../api/ViewerAPI";

// ── Bao ── watchlist and compare buttons under the price
import AssetActions from "../features/browse/AssetActions";

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

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString();
}

function getChartResult(response) {
  return response?.chart?.result?.[0] || null;
}

export default function StockDetail() {
  const { symbol } = useParams();

  const [description, setDescription] =
    useState("");

  const [marketData, setMarketData] =
    useState(null);
  const [chartData, setChartData] = useState([]);

  const [selectedRange, setSelectedRange] =
    useState("1Y");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (symbol) {
      loadDetails();
    }
  }, [symbol]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      // ── Bao ── the headlines moved to /summary/:symbol; the short
      // description stays. allSettled because the description endpoint
      // returns 400 for any symbol not already in the watchlist, and one
      // rejection used to blank the whole page.
      const [titleResult, marketResult] =
        await Promise.allSettled([
          getTitle(symbol),
          getData(symbol),
        ]);

      const titleData =
        titleResult.status === "fulfilled"
          ? titleResult.value?.data
          : null;

      setDescription(
        (typeof titleData === "object"
          ? titleData?.extract ||
            titleData?.description ||
            titleData?.summary
          : titleData) || ""
      );

      const marketResponse =
        marketResult.status === "fulfilled"
          ? marketResult.value
          : null;

      if (!marketResponse) {
        setErrorMessage(
          "Could not load prices for this asset."
        );
      }

      const result = getChartResult(
        marketResponse
      );

      const metadata = result?.meta || {};
      const timestamps = result?.timestamp || [];
      const quote =
        result?.indicators?.quote?.[0] || {};

      const prices = timestamps
        .map((timestamp, index) => ({
          date: formatDate(timestamp * 1000),
          open: quote.open?.[index] ?? null,
          high: quote.high?.[index] ?? null,
          low: quote.low?.[index] ?? null,
          close: quote.close?.[index] ?? null,
          volume: quote.volume?.[index] ?? null,
        }))
        .filter(
          (item) =>
            item.close !== null &&
            item.close !== undefined
        );

      setMarketData({
        ...metadata,
        prices,
      });

      setChartData(prices);
    } catch (error) {
      console.error(
        "Could not load stock details:",
        error
      );

      setErrorMessage(
        "Could not load details for this asset."
      );
    } finally {
      setLoading(false);
    }
  };

  const visibleChartData = useMemo(() => {
    if (selectedRange === "1W") {
      return chartData.slice(-7);
    }

    if (selectedRange === "1M") {
      return chartData.slice(-30);
    }

    if (selectedRange === "3M") {
      return chartData.slice(-90);
    }

    return chartData;
  }, [chartData, selectedRange]);

  if (loading) {
    return (
      <main className="stock-detail-page">
        <p className="eyebrow">
          MARKET DETAILS
        </p>

        <h1>
          Loading {symbol?.toUpperCase()}...
        </h1>
      </main>
    );
  }

  const prices = marketData?.prices || [];
  const latest = prices[prices.length - 1];
  const previous = prices[prices.length - 2];

  const currentPrice =
    latest?.close ??
    marketData?.regularMarketPrice;

  const previousClose =
    previous?.close ??
    marketData?.chartPreviousClose;

  // ── Bao ── the series is 1-minute candles, so `latest` describes one
  // minute, not the session. Reading the day figures off it made open,
  // high and low identical whenever nothing traded in that last minute.
  // Yahoo sends the real ones in meta; only open has to be derived.
  const fromSeries = (key, combine) => {
    const values = prices
      .map((point) => point[key])
      .filter((value) => typeof value === "number");

    return values.length ? combine(values) : undefined;
  };

  const sum = (values) =>
    values.reduce((total, value) => total + value, 0);

  const dayOpen = prices[0]?.open;

  const dayHigh =
    marketData?.regularMarketDayHigh ??
    fromSeries("high", (values) => Math.max(...values));

  const dayLow =
    marketData?.regularMarketDayLow ??
    fromSeries("low", (values) => Math.min(...values));

  const dayVolume =
    marketData?.regularMarketVolume ??
    fromSeries("volume", sum);

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

  const companyName =
    marketData?.longName ||
    marketData?.shortName ||
    symbol?.toUpperCase();

  return (
    <main className="stock-detail-page">
      <Link
        to="/stocks"
        className="secondary-link"
      >
        ← Back to markets
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

        {/* ── Bao ── */}
        <AssetActions
          symbol={symbol?.toUpperCase()}
          name={companyName}
          type={marketData?.instrumentType}
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
            {["1W", "1M", "3M", "1Y"].map(
              (range) => (
                <button
                  type="button"
                  className={
                    selectedRange === range
                      ? "chart-range active"
                      : "chart-range"
                  }
                  key={range}
                  onClick={() =>
                    setSelectedRange(range)
                  }
                >
                  {range}
                </button>
              )
            )}
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
        {/* ── Bao ── day figures, not the last minute's */}
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

      {/* ── Bao ── only the headlines moved to /summary/:symbol */}
      <section className="stock-information-grid">
        <article className="stock-detail-card">
          <p className="eyebrow">
            ABOUT THIS ASSET
          </p>

          <h2>Overview</h2>

          <p className="company-description">
            {description ||
              "No description available for this asset."}
          </p>

          <div className="company-meta">
            <div>
              <span>Exchange</span>

              <strong>
                {marketData?.exchangeName || "—"}
              </strong>
            </div>

            <div>
              <span>Market</span>

              <strong>
                {marketData?.market || "—"}
              </strong>
            </div>

            <div>
              <span>Timezone</span>

              <strong>
                {marketData?.exchangeTimezoneName ||
                  "—"}
              </strong>
            </div>

            <div>
              <span>Currency</span>

              <strong>
                {marketData?.currency || "USD"}
              </strong>
            </div>
          </div>
        </article>

        {/* Takes the slot the news used to fill, and is how someone who
            landed here finds the longer write-up */}
        <article className="stock-detail-card summary-invite">
          <p className="eyebrow">FULL BACKGROUND</p>

          <h2>Read more about {symbol?.toUpperCase()}</h2>

          <p>
            The complete description and the recent headlines are on the
            summary page, away from the price and the chart.
          </p>

          <Link
            to={`/summary/${symbol?.toUpperCase()}`}
            className="outline-button"
          >
            Open summary →
          </Link>
        </article>
      </section>
    </main>
  );
}