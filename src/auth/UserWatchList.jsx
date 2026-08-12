import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getWatchlist,
  deteleWatchlist,
} from "../api/ViewerAPI";

// ── Bao ── search/filter/sort toolbar and the live price on each row
import AssetPrice from "../features/browse/AssetPrice";
import { useWatchlistTools } from "../features/browse/useWatchlistTools";

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

  // ── Bao ── the toolbar is for the full page only; the dashboard shows a
  // short preview, so it keeps the original order and just gains prices.
  const { toolbar, visible, prices } =
    useWatchlistTools(usersWatchList);

  const displayedItems =
    limit > 0
      ? usersWatchList.slice(0, limit)
      : visible;

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
    <>
    {/* ── Bao ── */}
    {limit === 0 && toolbar}

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

          {/* ── Bao ── */}
          <div className="watchlist-item-side">
            <AssetPrice
              value={prices[item.symbol]}
            />

            <div className="watchlist-item-buttons">
              {/* The whole row already opens this page, but a button
                  makes it obvious that it can be opened at all */}
              <button
                type="button"
                className="watchlist-detail-button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/summary/${item.symbol}`);
                }}
              >
                About this asset
              </button>

              <button
                type="button"
                className="watchlist-remove-button"
                onClick={(event) =>
                  deleteStock(event, item.symbol)
                }
              >
                Remove
              </button>
            </div>
          </div>
        </article>
      ))}

      {/* ── Bao ── everything filtered away */}
      {displayedItems.length === 0 && (
        <p className="watchlist-no-match">
          No asset in your watchlist matches
          these filters.
        </p>
      )}

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
    </>
  );
}