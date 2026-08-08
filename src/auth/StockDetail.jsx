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

import {
  getTitle,
  getNews,
  getData,
} from "../api/ViewerAPI";

function getNewsList(response) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.news)) {
    return data.news;
  }

  if (Array.isArray(data?.articles)) {
    return data.articles;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

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

  const [news, setNews] = useState([]);
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

      const [
        descriptionResponse,
        newsResponse,
        marketResponse,
      ] = await Promise.all([
        getTitle(symbol),
        getNews(symbol),
        getData(symbol),
      ]);

      const descriptionData =
        descriptionResponse?.data;

      if (
        descriptionData &&
        typeof descriptionData === "object"
      ) {
        setDescription(
          descriptionData.extract ||
            descriptionData.description ||
            descriptionData.summary ||
            "No description available."
        );
      } else {
        setDescription(
          descriptionData ||
            "No description available."
        );
      }

      setNews(getNewsList(newsResponse));

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
        <div className="stock-stat-card">
          <span>Open</span>
          <strong>
            {formatPrice(latest?.open)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Day high</span>
          <strong>
            {formatPrice(latest?.high)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Day low</span>
          <strong>
            {formatPrice(latest?.low)}
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
            {formatNumber(latest?.volume)}
          </strong>
        </div>

        <div className="stock-stat-card">
          <span>Currency</span>
          <strong>
            {marketData?.currency || "USD"}
          </strong>
        </div>
      </section>

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

        <article className="stock-detail-card">
          <p className="eyebrow">
            LATEST NEWS
          </p>

          <h2>Related news</h2>

          {news.length === 0 ? (
            <div className="news-placeholder">
              <div className="news-placeholder-icon">
                ◌
              </div>

              <div>
                <h3>No news available</h3>

                <p>
                  There are currently no news articles
                  for this asset.
                </p>
              </div>
            </div>
          ) : (
            <div className="stock-news-list">
              {news.map((article, index) => (
                <article
                  className="stock-news-item"
                  key={
                    article.id ||
                    article.url ||
                    index
                  }
                >
                  <h3>
                    {article.headline ||
                      article.title ||
                      "Market update"}
                  </h3>

                  {article.summary && (
                    <p>{article.summary}</p>
                  )}

                  {article.source && (
                    <small>
                      Source: {article.source}
                    </small>
                  )}

                  {article.date && (
                    <small>
                      {formatDate(article.date)}
                    </small>
                  )}

                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read article →
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}