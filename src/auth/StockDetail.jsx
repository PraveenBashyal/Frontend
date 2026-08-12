import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getTitle,
  getNews,
  getData,
  addStockToWatchlist,
} from "../api/ViewerAPI";

export default function StockDetail() {
  const { symbol } = useParams();
  const [isAdded, setIsAdded] = useState(false);

const [addingToDashboard, setAddingToDashboard] =
  useState(false);

const [dashboardMessage, setDashboardMessage] =
  useState("");
  const [description, setDescription] = useState("");
  const [news, setNews] = useState([]);
  const [history, setHistory] = useState([]);
  const [assetName, setAssetName] = useState("");
  const [marketData, setMarketData] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (symbol) {
      loadAssetData();
    }
  }, [symbol]);

  async function loadAssetData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const [titleResult, newsResult, dataResult] =
        await Promise.allSettled([
          getTitle(symbol),
          getNews(symbol),
          getData(symbol),
        ]);

      let loadedSomething = false;

      if (titleResult.status === "fulfilled") {
        const titleResponse = titleResult.value;
        const titleData = titleResponse?.data;

        if (typeof titleData === "object") {
          setDescription(
            titleData.extract ||
              titleData.description ||
              titleData.summary ||
              ""
          );

          setAssetName(
            titleData.title ||
              titleData.name ||
              titleData.securityName ||
              ""
          );
        } else {
          setDescription(titleData || "");
        }

        loadedSomething = true;
      } else {
        console.error(
          "Stock title request failed:",
          titleResult.reason
        );
      }

      if (newsResult.status === "fulfilled") {
        const newsResponse = newsResult.value;
        const newsData =
          newsResponse?.data || newsResponse;

        if (Array.isArray(newsData)) {
          setNews(newsData);
        } else if (Array.isArray(newsData?.articles)) {
          setNews(newsData.articles);
        } else if (Array.isArray(newsData?.news)) {
          setNews(newsData.news);
        }

        loadedSomething = true;
      } else {
        console.error(
          "Stock news request failed:",
          newsResult.reason
        );
      }

      if (dataResult.status === "fulfilled") {
        const marketResponse = dataResult.value;
        const result =
          marketResponse?.chart?.result?.[0];

        const meta = result?.meta || {};

        setMarketData(meta);

        const timestamps = result?.timestamp || [];
        const closes =
          result?.indicators?.quote?.[0]?.close || [];

        const historyData = timestamps
          .map((timestamp, index) => ({
            date: new Date(timestamp * 1000),
            close: closes[index],
          }))
          .filter((item) => item.close !== null)
          .slice(-30);

        setHistory(historyData);
        loadedSomething = true;
      } else {
        console.error(
          "Stock market-data request failed:",
          dataResult.reason
        );
      }

      if (!loadedSomething) {
        setErrorMessage(
          "Could not load asset details. Check the backend connection."
        );
      }
    } catch (error) {
      console.error(
        "Could not load asset details:",
        error
      );

      setErrorMessage(
        "Could not load asset details."
      );
    } finally {
      setLoading(false);
    }
  }
   function handleAddToDashboard() {
  if (isAdded) {
    return;
  }

  try {
    setAddingToDashboard(true);
    setDashboardMessage("");

     addStockToWatchlist({
      symbol: symbol.toUpperCase(),
      securityName:
        assetName || symbol.toUpperCase(),
      type: "Stock",
    });

    setIsAdded(true);
    setDashboardMessage(
      "Added to dashboard successfully."
    );
  } catch (error) {
    console.error(
      "Could not add asset to dashboard:",
      error
    );

    if (error.response?.status === 409) {
      setIsAdded(true);
      setDashboardMessage(
        "This asset is already on your dashboard."
      );
    } else if (error.response?.status === 401) {
      setDashboardMessage(
        "Please log in before adding an asset."
      );
    } else {
      setDashboardMessage(
        "Could not add this asset to the dashboard."
      );
    }
  } finally {
    setAddingToDashboard(false);
  }

}

  function formatPrice(value) {
    if (value === undefined || value === null) {
      return "—";
    }

    return Number(value).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  }

  function formatDate(date) {
    return date.toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getNewsHeadline(article) {
    return (
      article?.headline ||
      article?.title ||
      article?.headlineText ||
      "Latest market news"
    );
  }

  function getNewsSource(article) {
    return (
      article?.source ||
      article?.publisher ||
      article?.provider ||
      "Market source"
    );
  }

  function getNewsSummary(article) {
    return (
      article?.summary ||
      article?.description ||
      article?.text ||
      "No summary available."
    );
  }

  function getNewsImage(article) {
    return (
      article?.image ||
      article?.imageUrl ||
      article?.thumbnail ||
      article?.thumbnailUrl ||
      ""
    );
  }

  const currentPrice =
    marketData?.regularMarketPrice;

  const previousClose =
    marketData?.chartPreviousClose;

  const change =
    currentPrice !== undefined &&
    previousClose !== undefined
      ? currentPrice - previousClose
      : null;

  const changePercent =
    change !== null && previousClose
      ? (change / previousClose) * 100
      : null;

  const isPositive = change >= 0;

  if (loading) {
    return (
      <main className="stock-detail-page">
        <p>Loading asset details...</p>
      </main>
    );
  }

  return (
    <main className="stock-detail-page">
      {errorMessage && (
        <p className="error-message">
          {errorMessage}
        </p>
      )}
       <button
        type="button"
        className={
        isAdded
      ? "add-to-dashboard-btn added"
      : "add-to-dashboard-btn"
        }
         onClick={handleAddToDashboard}
         disabled={addingToDashboard || isAdded}
        >
        {addingToDashboard
         ? "Adding..."
           : isAdded
         ? "Added to dashboard ✓"
        : "Add to dashboard"}
        </button>

{dashboardMessage && (
  <p className="dashboard-message">
    {dashboardMessage}
  </p>
)}
      <section className="stock-detail-header">
        <p className="eyebrow">MARKET DETAILS</p>

        <h1>
          {assetName || symbol?.toUpperCase()}
        </h1>

        <p className="stock-detail-symbol">
          {symbol?.toUpperCase()}
        </p>

        <div className="stock-price-card">
          <span className="stock-current-price">
            {formatPrice(currentPrice)}
          </span>

          {change !== null && (
            <span
              className={
                isPositive
                  ? "stock-change positive"
                  : "stock-change negative"
              }
            >
              {isPositive ? "+" : ""}
              {formatPrice(change)}
              {" "}
              ({isPositive ? "+" : ""}
              {changePercent?.toFixed(2)}%)
            </span>
          )}
        </div>
      </section>

      <section className="stock-market-summary">
        <div>
          <span>Previous close</span>
          <strong>
            {formatPrice(previousClose)}
          </strong>
        </div>

        <div>
          <span>Currency</span>
          <strong>
            {marketData?.currency || "USD"}
          </strong>
        </div>
      </section>

      <section className="stock-description-section">
        <p className="eyebrow">ABOUT THIS ASSET</p>

        <p>
          {description ||
            "No description available for this asset."}
        </p>
      </section>

      <section className="stock-news-section">
  <p className="eyebrow">RECENT NEWS</p>

  {news.length === 0 ? (
    <p>
      No recent news is available for this asset.
    </p>
  ) : (
    news.map((article, index) => {
      const image = getNewsImage(article);

      return (
        <article
          className="stock-news-item"
          key={article.id || index}
        >
          {image && (
            <img
              className="stock-news-image"
              src={image}
              alt=""
            />
          )}

          <div>
            <h2>
              {getNewsHeadline(article)}
            </h2>

            <p className="stock-news-source">
              Source: {getNewsSource(article)}
            </p>

            <p>
              {getNewsSummary(article)}
            </p>

            {article?.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
              >
                Read article →
              </a>
            )}
          </div>
        </article>
      );
    })
  )}
</section>
    </main>
  );
}