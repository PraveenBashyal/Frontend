import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWatchlist,
  deteleWatchlist,
} from "../api/ViewerAPI";

export default function UserWatchList({
  limit = 0,
  compact = false,
}) {
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getWatchlist();

      setWatchlist(
        Array.isArray(response) ? response : []
      );
    } catch (error) {
      console.error(
        "Could not load watchlist:",
        error
      );

      setErrorMessage(
        "Could not load your watchlist."
      );
    } finally {
      setLoading(false);
    }
  }

  function openAssetDetails(symbol) {
    navigate(`/stock/${symbol}`);
  }

  async function removeAsset(event, symbol) {
    event.stopPropagation();

    try {
      await deteleWatchlist(symbol);

      setWatchlist((previousAssets) =>
        previousAssets.filter(
          (asset) => asset.symbol !== symbol
        )
      );
    } catch (error) {
      console.error(
        "Could not remove asset:",
        error
      );

      setErrorMessage(
        "Could not remove this asset."
      );
    }
  }

  const displayedAssets =
    limit > 0
      ? watchlist.slice(0, limit)
      : watchlist;

  if (loading) {
    return (
      <div className="watchlist-message">
        Loading watchlist...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="watchlist-message error-message">
        {errorMessage}
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className="watchlist-message">
        Add stocks, ETFs, or crypto assets from Explore Markets.
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "watchlist-list compact"
          : "watchlist-list"
      }
    >
      {displayedAssets.map((asset) => (
        <article
          key={asset.symbol}
          className="watchlist-item"
          onClick={() =>
            openAssetDetails(asset.symbol)
          }
        >
          <div className="watchlist-item-information">
            <strong>
              {asset.symbol}
            </strong>

            <span>
              {asset.securityName || "Asset"}
            </span>

            <small>
              {asset.type || "Asset"}
            </small>
          </div>

          <button
            type="button"
            className="remove-watchlist-button"
            onClick={(event) =>
              removeAsset(event, asset.symbol)
            }
          >
            Remove
          </button>
        </article>
      ))}
    </div>
  );
}