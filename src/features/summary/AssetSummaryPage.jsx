import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getTitle, getNews } from "../../api/ViewerAPI";

// What the asset is, rather than what it costs. Description from
// Wikipedia, headlines from Finnhub, both through the backend.
function readDescription(response) {
  const data = response?.data;

  if (data && typeof data === "object") {
    return (
      data.extract ||
      data.description ||
      data.summary ||
      ""
    );
  }

  // What the backend sends when Wikipedia has no page
  return typeof data === "string" && data !== "Description not found"
    ? data
    : "";
}

function readNews(response) {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : [];
}

export default function AssetSummaryPage() {
  const { symbol } = useParams();

  const [description, setDescription] = useState("");
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return undefined;

    let cancelled = false;

    // allSettled, so a missing Wikipedia page still leaves the headlines
    Promise.allSettled([getTitle(symbol), getNews(symbol)]).then(
      ([titleResult, newsResult]) => {
        if (cancelled) return;

        setDescription(
          titleResult.status === "fulfilled"
            ? readDescription(titleResult.value)
            : ""
        );

        setNews(
          newsResult.status === "fulfilled" ? readNews(newsResult.value) : []
        );

        setLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const ticker = symbol?.toUpperCase();

  return (
    <main className="stock-detail-page">
      <Link to="/watchlist" className="secondary-link">
        ← Back to watchlist
      </Link>

      <section className="stock-detail-header">
        <p className="eyebrow">ABOUT THIS ASSET</p>

        <div className="stock-title-row">
          <div>
            <p className="stock-symbol">{ticker}</p>
            <h1>What {ticker} is</h1>
          </div>

          <Link to={`/stock/${ticker}`} className="outline-button">
            Price and chart →
          </Link>
        </div>
      </section>

      {loading ? (
        <p className="portfolio-message">Loading summary...</p>
      ) : (
        <>
          {/* Full width and no card: this is prose, and prose is easier to
              read running across the page than boxed into a column */}
          <section className="summary-section">
            <p className="eyebrow">OVERVIEW</p>
            <h2>Background</h2>

            {description ? (
              <p className="summary-text">{description}</p>
            ) : (
              <p className="portfolio-message">
                No background description is available for {ticker}. This
                comes from Wikipedia, which has no page matching its
                registered name.
              </p>
            )}
          </section>

          <section className="summary-section">
            <p className="eyebrow">IN THE NEWS</p>
            <h2>Recent coverage</h2>

            {news.length === 0 ? (
              <p className="portfolio-message">
                No recent articles were found for {ticker}.
              </p>
            ) : (
              <div className="summary-news">
                {news.slice(0, 10).map((article, index) => (
                  <article
                    className="summary-news-item"
                    key={article.url || article.id || index}
                  >
                    <h3>{article.headline || article.title || "Market update"}</h3>

                    {article.summary && (
                      <p className="summary-text">{article.summary}</p>
                    )}

                    <p className="summary-news-meta">
                      {article.source && <span>{article.source}</span>}

                      {article.url && (
                        <a href={article.url} target="_blank" rel="noreferrer">
                          Read article →
                        </a>
                      )}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
