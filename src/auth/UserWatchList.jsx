import { useEffect, useState } from "react";
import { getWatchlist, deteleWatchlist } from "../api/ViewerAPI";
import { useNavigate } from "react-router-dom";

export default function UserWatchList() {
  const navigate = useNavigate();
  const [usersWatchList, setUsersWatchList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadWatchlist() {
    try {
      setLoading(true);
      const response = await getWatchlist();
      setUsersWatchList(response || []);
    } catch (error) {
      console.log(error);
      setMessage("Failed to load watchlist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function deleteStock(symbol) {
    try {
      await deteleWatchlist(symbol);
      setUsersWatchList((prev) => prev.filter((item) => item.symbol !== symbol));
    } catch (error) {
      console.log(error);
      setMessage("Failed to remove asset.");
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">My Watchlist</h1>
      <p className="page-subtitle">
        Track your selected stocks, crypto assets, and ETFs in one place.
      </p>

      <div className="section-card">
        {message && <p className="error-text">{message}</p>}
        {loading ? (
          <p className="auth-text">Loading watchlist...</p>
        ) : usersWatchList.length === 0 ? (
          <div className="empty-state">
            Your watchlist is empty. Add some assets from the search page.
          </div>
        ) : (
          <ul className="stock-list">
            {usersWatchList.map((item) => (
              <li className="stock-item" key={item.symbol}>
                <div
                  className="stock-info"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/stock/${item.symbol}`)}
                >
                  <div className="stock-symbol">{item.symbol}</div>
                  <div className="stock-name">
                    {item.securityName || item.name || "Unnamed Asset"}
                  </div>
                  <div className="stock-type">{item.type || "Asset"}</div>
                </div>

                <div className="item-actions">
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => deleteStock(item.symbol)}
                  >
                    Remove
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