import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getTitle,
  getNews,
  getData,
} from "../api/ViewerAPI";

export default function StockDetail() {
  const { symbol } = useParams();

  const [description, setDescription] = useState("");
  const [news, setNews] = useState([]);
  const [marketStatus, setMarketStatus] = useState("");
  const [assetName, setAssetName] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadAssetData();
  }, [symbol]);

  async function loadAssetData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const titleResponse = await getTitle(symbol);

      if (
        titleResponse?.data &&
        typeof titleResponse.data === "object"
      ) {
        setDescription(
          titleResponse.data.extract ||
            titleResponse.data.description ||
            ""
        );

        setAssetName(
          titleResponse.data.title ||
            titleResponse.data.name ||
            ""
        );
      } else {
        setDescription(
          titleResponse?.data || ""
        );
      }

      const newsResponse = await getNews(symbol);

      const newsData =
        newsResponse?.data || newsResponse;

      if (Array.isArray(newsData)) {
        setNews(newsData);
      } else if (Array.isArray(newsData?.articles)) {
        setNews(newsData.articles);
      } else if (Array.isArray(newsData?.news)) {
        setNews(newsData.news);
      } else {
        setNews([]);
      }

      const marketData = await getData(symbol);

      const result =
        marketData?.chart?.result?.[0];

      const currentPrice =
        result?.meta?.regularMarketPrice;

      const previousClose =
        result?.meta?.chartPreviousClose;

      if (
        currentPrice !== undefined &&
        previousClose !== undefined
      ) {
        if (currentPrice > previousClose) {
          setMarketStatus("Price is high 📈");
        } else if (currentPrice < previousClose) {
          setMarketStatus("Price is low 📉");
        } else {
          setMarketStatus("Price is unchanged");
        }
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

  if (loading) {
    return (
      <main className="stock-detail-page">
        <p>Loading asset details...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="stock-detail-page">
        <p className="error-message">
          {errorMessage}
        </p>
      </main>
    );
  }

  return (
    <main className="stock-detail-page">
      <section className="stock-detail-header">
        <p className="eyebrow">MARKET DETAILS</p>

        <h1>
          {assetName || symbol?.toUpperCase()}
        </h1>

        {assetName && (
          <p className="stock-detail-symbol">
            {symbol?.toUpperCase()}
          </p>
        )}
      </section>

      <section className="stock-description-section">
        <p>
          {description ||
            "No description available for this asset."}
        </p>
      </section>

      <section className="stock-news-section">
        {news.length === 0 ? (
          <p>No news available.</p>
        ) : (
          news.map((article, index) => {
            const image = getNewsImage(article);

            return (
              <article
                className="stock-news-item"
                key={article.id || index}
              >
                <h2>
                  {getNewsHeadline(article)}
                </h2>

                <p className="stock-news-source">
                  Source: {getNewsSource(article)}
                </p>

                <p>
                  {getNewsSummary(article)}
                </p>

                {image && (
                  <p className="stock-news-image">
                    Image: {image}
                  </p>
                )}
              </article>
            );
          })
        )}
      </section>

      {marketStatus && (
        <section className="stock-market-status">
          <h2>Status: {marketStatus}</h2>
        </section>
      )}
    </main>
  );
}