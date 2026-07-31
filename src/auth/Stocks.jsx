import { useState, useEffect } from "react";
import {
  getStocks,
  getCrypto,
  getETF,
  addStockToWatchlist,
} from "../api/ViewerAPI";
import { useNavigate } from "react-router-dom";

export default function SearchStocks() {
  const navigate = useNavigate();

  const [inputText, setInputText] = useState("");
  const [stockList, setStockList] = useState([]);
  const [watchlist, setWatchList] = useState([]);
  const [optionType, setOptionType] = useState("Stock");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAssets = async () => {
      if (inputText.trim() === "") {
        setStockList([]);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        if (optionType === "Stock") {
          const data = await getStocks(inputText);
          setStockList(data || []);
        } else if (optionType === "Crypto") {
          const data = await getCrypto(inputText);
          setStockList(data || []);
        } else if (optionType === "ETF") {
          const data = await getETF(inputText);
          setStockList(data || []);
        }
      } catch (error) {
        console.log(error);
        setStockList([]);
        setMessage("Could not load assets from the backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [inputText, optionType]);

  async function addToWatchlist(asset) {
    if (watchlist.some((item) => item.symbol === asset.symbol)) {
      return;
    }

    const stockData = {
      symbol: asset.symbol,
      securityName: asset.securityName || asset.name || asset.symbol,
      type: optionType,
    };

    try {
      await addStockToWatchlist(stockData);
      setWatchList((prev) => [...prev, stockData]);
      setMessage(`${stockData.symbol} added to watchlist.`);
    } catch (error) {
      console.log(error);
      setMessage("Failed to add asset to watchlist.");
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Search Assets</h1>
      <p className="page-subtitle">
        Search for stocks, ETFs, and crypto assets to explore market options.
      </p>

      <div className="section-card">
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label className="form-label">Asset Type</label>
            <select
              className="form-select"
              value={optionType}
              onChange={(e) => setOptionType(e.target.value)}
            >
              <option value="Stock">Stock</option>
              <option value="Crypto">Crypto</option>
              <option value="ETF">ETF</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Search</label>
            <input
              className="form-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Enter ${optionType} name or symbol`}
            />
          </div>
        </form>

        {message && <p className="success-text">{message}</p>}
        {loading && <p className="auth-text">Loading assets...</p>}

        {!loading && stockList.length === 0 && inputText.trim() !== "" ? (
          <div className="empty-state">
            No matching {optionType.toLowerCase()} assets found.
          </div>
        ) : (
          <ul className="stock-list">
            {stockList.map((item, index) => (
              <li className="stock-item" key={`${item.symbol}-${index}`}>
                <div
                  className="stock-info"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/stock/${item.symbol}`)}
                >
                  <div className="stock-symbol">{item.symbol}</div>
                  <div className="stock-name">
                    {item.securityName || item.name || "Unnamed Asset"}
                  </div>
                  <div className="stock-type">{optionType}</div>
                </div>

                <div className="item-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => addToWatchlist(item)}
                    type="button"
                  >
                    Add to Watchlist
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}