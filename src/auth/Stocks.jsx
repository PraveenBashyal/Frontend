import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  addStockToWatchlist,
  getStocks,
  getCrypto,
  getETF,
} from "../api/ViewerAPI";

// ── Bao ── sort dropdown next to the existing type filter
import SortSelect from "../features/browse/SortSelect";
import { sortAssets } from "../features/browse/assetFilters";

const LETTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function unwrapResponse(response) {
  return response?.data ?? response;
}

function extractAssets(response) {
  const data = unwrapResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  const possibleLists = [
    data?.assets,
    data?.data,
    data?.results,
    data?.items,
    data?.stocks,
    data?.crypto,
    data?.etfs,
    data?.content,
  ];

  return (
    possibleLists.find((list) =>
      Array.isArray(list)
    ) || []
  );
}

function getSymbol(asset) {
  return (
    asset?.symbol ||
    asset?.Symbol ||
    asset?.ticker ||
    asset?.Ticker ||
    asset?.code ||
    ""
  );
}

function getName(asset) {
  const symbol = getSymbol(asset);

  return (
    asset?.name ||
    asset?.Name ||
    asset?.companyName ||
    asset?.company_name ||
    asset?.securityName ||
    asset?.longName ||
    asset?.shortName ||
    asset?.displayName ||
    asset?.description ||
    symbol ||
    "Asset"
  );
}

function getType(asset, fallbackType) {
  return (
    asset?.type ||
    asset?.assetType ||
    asset?.asset_type ||
    asset?.category ||
    fallbackType
  );
}

function normaliseAsset(asset, fallbackType) {
  return {
    ...asset,
    symbol: getSymbol(asset),
    name: getName(asset),
    type: getType(asset, fallbackType),
  };
}

function removeDuplicates(assets) {
  return Array.from(
    new Map(
      assets
        .filter((asset) => asset.symbol)
        .map((asset) => [
          asset.symbol.toUpperCase(),
          asset,
        ])
    ).values()
  );
}

async function loadByLetters(
  requestFunction,
  assetType
) {
  const responses = await Promise.all(
    LETTERS.map((letter) =>
      requestFunction(letter)
    )
  );

  const assets = responses.flatMap((response) =>
    extractAssets(response).map((asset) =>
      normaliseAsset(asset, assetType)
    )
  );

  return removeDuplicates(assets);
}

function matchesType(asset, selectedType) {
  if (selectedType === "all") {
    return true;
  }

  const type = String(
    asset.type || ""
  ).toLowerCase();

  if (selectedType === "stocks") {
    return (
      type.includes("stock") ||
      type.includes("equity") ||
      type.includes("share")
    );
  }

  if (selectedType === "etfs") {
    return (
      type.includes("etf") ||
      type.includes("exchange")
    );
  }

  if (selectedType === "crypto") {
    return (
      type.includes("crypto") ||
      type.includes("coin") ||
      type.includes("digital")
    );
  }

  return true;
}

export default function Stocks() {
  const [assets, setAssets] = useState([]);

  const [selectedType, setSelectedType] =
    useState("all");

  const [searchTerm, setSearchTerm] =
    useState("");

  // ── Bao ──
  const [sortMode, setSortMode] = useState("az");

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [addingSymbol, setAddingSymbol] =
    useState("");

  const [addedSymbols, setAddedSymbols] =
    useState(new Set());

  const [watchlistMessage, setWatchlistMessage] =
    useState("");

  useEffect(() => {
    loadAllAssets();
  }, []);

  const loadAllAssets = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        stocks,
        crypto,
        etfs,
      ] = await Promise.all([
        loadByLetters(
          getStocks,
          "Stock"
        ),

        loadByLetters(
          getCrypto,
          "Crypto"
        ),

        loadByLetters(
          getETF,
          "ETF"
        ),
      ]);

      const allAssets = removeDuplicates([
        ...stocks,
        ...crypto,
        ...etfs,
      ]);

      setAssets(allAssets);
    } catch (error) {
      console.error(
        "Could not load assets:",
        error
      );

      setAssets([]);

      setErrorMessage(
        "Could not load the available assets."
      );
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (event, asset) => {
    event.preventDefault();
    event.stopPropagation();

    const symbol = asset.symbol.toUpperCase();

    if (addedSymbols.has(symbol)) {
      return;
    }

    try {
      setAddingSymbol(symbol);
      setWatchlistMessage("");
      setErrorMessage("");

      await addStockToWatchlist({
        symbol,
        securityName: asset.name,
        type: asset.type,
      });

      setAddedSymbols((previousSymbols) => {
        const nextSymbols = new Set(
          previousSymbols
        );

        nextSymbols.add(symbol);

        return nextSymbols;
      });

      setWatchlistMessage(
        `${symbol} was added to your watchlist.`
      );
    } catch (error) {
      console.error(
        "Could not add asset to watchlist:",
        error
      );

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data;

      if (typeof backendMessage === "string") {
        setErrorMessage(backendMessage);
      } else {
        setErrorMessage(
          `Could not add ${symbol} to your watchlist.`
        );
      }
    } finally {
      setAddingSymbol("");
    }
  };

  const filteredAssets = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return assets
      .filter((asset) =>
        matchesType(asset, selectedType)
      )
      .filter((asset) => {
        if (!search) {
          return true;
        }

        return (
          asset.symbol
            .toLowerCase()
            .includes(search) ||
          asset.name
            .toLowerCase()
            .includes(search)
        );
      })
      .sort((first, second) =>
        first.symbol
          .toLowerCase()
          .localeCompare(
            second.symbol.toLowerCase()
          )
      );
  }, [
    assets,
    selectedType,
    searchTerm,
  ]);

  // ── Bao ── applies the chosen order on top of the filtering above
  const sortedAssets = useMemo(
    () => sortAssets(filteredAssets, sortMode),
    [filteredAssets, sortMode]
  );

  return (
    <main className="stocks-page">
      <p className="eyebrow">
        EXPLORE MARKETS
      </p>

      <h1>Explore assets</h1>

      <p className="stocks-intro">
        Browse stocks, ETFs, and crypto assets
        alphabetically.
      </p>

      <section className="asset-search-panel">
        <div className="asset-search-wrapper">
          <span className="asset-search-icon">
            ⌕
          </span>

          <input
            className="asset-search-input"
            type="search"
            placeholder="Search by symbol or name..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <select
          className="asset-type-select"
          value={selectedType}
          onChange={(event) =>
            setSelectedType(event.target.value)
          }
        >
          <option value="all">
            All assets
          </option>

          <option value="stocks">
            Stocks
          </option>

          <option value="etfs">
            ETFs
          </option>

          <option value="crypto">
            Crypto
          </option>
        </select>

        {/* ── Bao ── */}
        <SortSelect
          value={sortMode}
          onChange={setSortMode}
        />
      </section>

      {watchlistMessage && (
        <p className="success-message">
          {watchlistMessage}
        </p>
      )}

      {errorMessage && (
        <p className="error-message">
          {errorMessage}
        </p>
      )}

      {loading ? (
        <section className="asset-empty-state">
          <div className="asset-loading-spinner" />

          <p>
            Loading assets by alphabet...
          </p>
        </section>
      ) : sortedAssets.length === 0 ? (
        <section className="asset-empty-state">
          <h2>No assets found</h2>

          <p>
            Try another search or choose a different
            category.
          </p>
        </section>
      ) : (
        <section className="asset-list">
          {sortedAssets.map((asset) => {
            const symbol =
              asset.symbol.toUpperCase();

            const isAdding =
              addingSymbol === symbol;

            const isAdded =
              addedSymbols.has(symbol);

            return (
              <article
                key={`${symbol}-${asset.name}`}
                className="asset-list-item"
              >
                <Link
                  to={`/stock/${encodeURIComponent(
                    symbol
                  )}`}
                  className="asset-list-main"
                >
                  <strong className="asset-list-symbol">
                    {symbol}
                  </strong>

                  <div className="asset-list-details">
                    <h3>{asset.name}</h3>

                    <span>{asset.type}</span>
                  </div>

                  <span className="asset-list-arrow">
                    →
                  </span>
                </Link>

                <button
                  type="button"
                  className={
                    isAdded
                      ? "watchlist-add-button added"
                      : "watchlist-add-button"
                  }
                  disabled={
                    isAdding || isAdded
                  }
                  onClick={(event) =>
                    addToWatchlist(
                      event,
                      asset
                    )
                  }
                >
                  {isAdding
                    ? "Adding..."
                    : isAdded
                    ? "Added"
                    : "Add to watchlist"}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}