import { useEffect, useState } from "react";
import { getTitle, getNews, getData } from "../api/ViewerAPI";
import { useParams } from "react-router-dom";

export default function StockDetail() {
  const { symbol } = useParams();

  const [description, setDescription] = useState("");
  const [news, setNews] = useState([]);
  const [marketResponse, setMarketResponse] = useState("");
  const [price, setPrice] = useState(null);
  const [change, setChange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);

        const titleResponse = await getTitle(symbol);
        if (titleResponse.status === 200) {
          setDescription(titleResponse.data.extract || "No description available.");
        } else {
          setDescription("No description available.");
        }

        const newsResponse = await getNews(symbol);
        setNews(newsResponse.data || []);

        const marketData = await getData(symbol);
        const meta = marketData.chart.result[0].meta;

        const regularMarketPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose;

        setPrice(regularMarketPrice);
        setChange(
          previousClose
            ? (((regularMarketPrice - previousClose) / previousClose) * 100).toFixed(2)
            : null
        );

        if (regularMarketPrice > previousClose) {
          setMarketResponse("Price is high 📈");
        } else {
          setMarketResponse("Price is low 📉");
        }
      } catch (error) {
        console.log(error);
        setDescription("Failed to load company details.");
        setNews([]);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [symbol]);

  if (loading) {
    return (
      <div className="page">
        <h1 className="page-title">{symbol}</h1>
        <p className="auth-text">Loading stock details...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">{symbol}</h1>
      <p className="page-subtitle">Asset Details</p>

      <div className="section-card">
        <div className="detail-header">
          <div>
            <div className="stock-symbol">{symbol}</div>
            <div className="stock-name">{description ? "Company information loaded" : "No company name found"}</div>
          </div>

          <div className="detail-price-box">
            <div className="detail-price">
              {price !== null ? `$${price}` : "N/A"}
            </div>
            <div className={`detail-change ${change >= 0 ? "positive" : "negative"}`}>
              {change !== null ? `${change}%` : "No change data"}
            </div>
          </div>
        </div>

        <div className={`market-badge ${change >= 0 ? "positive" : "negative"}`}>
          {marketResponse || "No market response"}
        </div>
      </div>

      <div className="section-card">
        <h2 className="section-title">Company Overview</h2>
        <p className="detail-description">{description}</p>
      </div>

      <div className="section-card">
        <h2 className="section-title">Latest News</h2>
        {news.length === 0 ? (
          <div className="empty-state">No news available for this asset.</div>
        ) : (
          <ul className="news-list">
            {news.map((item, index) => (
              <li className="news-item" key={index}>
                {item.title || item.headline || JSON.stringify(item)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}