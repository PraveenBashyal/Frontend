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

  const [usersWatchList, setUsersWatchList] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getWatchlist();

      setUsersWatchList(
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
  };

  const openAssetDetails = (symbol) => {
    navigate(`/stock/${symbol}`);
  };

  const deleteStock = async (event, symbol) => {
    event.stopPropagation();

    try {
      await deteleWatchlist(symbol);

      setUsersWatchList((previousItems) =>
        previousItems.filter(
          (item) => item.symbol !== symbol
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
  };

  const displayedItems =
    limit > 0
      ? usersWatchList.slice(0, limit)
      : usersWatchList;

  if (loading) {
    return (
      <div className="watchlist-empty-state">
        <p>Loading watchlist...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="watchlist-empty-state">
        <p className="error-message">
          {errorMessage}
        </p>

        <button
          type="button"
          className="outline-button"
          onClick={loadWatchlist}
        >
          Try again
        </button>
      </div>
    );
  }

  if (usersWatchList.length === 0) {
    return (
      <div className="watchlist-empty-state">
        <div className="watchlist-empty-icon">
          ☆
        </div>

        <h3>Your watchlist is empty</h3>

        <p>
          Add stocks, ETFs, or crypto assets from the
          market search page.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "watchlist-list compact-watchlist"
          : "watchlist-list"
      }
    >
      {displayedItems.map((item) => (
        <article
          className="watchlist-item clickable-asset"
          key={`${item.type}-${item.symbol}`}
          onClick={() =>
            openAssetDetails(item.symbol)
          }
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              openAssetDetails(item.symbol);
            }
          }}
        >
          <div className="watchlist-item-info">
            <strong>{item.symbol}</strong>

            <span>
              {item.securityName || "Asset"}
            </span>

            {item.type && (
              <small>{item.type}</small>
            )}
          </div>

          <button
            type="button"
            className="watchlist-remove-button"
            onClick={(event) =>
              deleteStock(event, item.symbol)
            }
          >
            Remove
          </button>
        </article>
      ))}

      {limit > 0 &&
        usersWatchList.length > limit && (
          <button
            type="button"
            className="watchlist-view-all"
            onClick={() => navigate("/watchlist")}
          >
            View all {usersWatchList.length} assets →
          </button>
        )}
    </div>
  );
}