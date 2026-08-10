import { useEffect, useMemo, useState } from "react";

import { fetchQuote } from "../../lib/market";
import SortSelect from "./SortSelect";
import {
  ALL_SORTS,
  TYPES,
  matchesSearch,
  matchesType,
  sortAssets,
} from "./assetFilters";

// Yahoo prices one symbol per request, so a few run at a time instead of
// all at once. A watchlist is short, so this still finishes quickly.
const AT_ONCE = 4;

function usePrices(symbols) {
  const [prices, setPrices] = useState({});

  // Depend on the joined list rather than the array, which is rebuilt on
  // every render and would restart the fetch each time.
  const key = symbols.join(",");

  useEffect(() => {
    if (!symbols.length) return undefined;

    let cancelled = false;
    const queue = [...symbols];

    const worker = async () => {
      while (queue.length && !cancelled) {
        const symbol = queue.shift();
        const quote = await fetchQuote(symbol);

        if (cancelled) return;
        setPrices((current) => ({ ...current, [symbol]: quote?.price ?? null }));
      }
    };

    Array.from({ length: AT_ONCE }, worker);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return prices;
}

// Returns the toolbar to render above the rows, the rows that survive it,
// and the prices to show inside them.
export function useWatchlistTools(items) {
  const [search, setSearch] = useState("");
  const [type, setType]     = useState("all");
  const [sort, setSort]     = useState("az");

  const symbols = useMemo(
    () => items.map((item) => item.symbol).filter(Boolean),
    [items]
  );

  const prices = usePrices(symbols);

  const visible = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        matchesType(item.type, type) &&
        matchesSearch(item.symbol, item.securityName, search)
    );

    return sortAssets(filtered, sort, (item) => prices[item.symbol] ?? null);
  }, [items, type, search, sort, prices]);

  const toolbar = (
    <section className="asset-search-panel">
      <div className="asset-search-wrapper">
        <span className="asset-search-icon">⌕</span>

        <input
          className="asset-search-input"
          type="search"
          placeholder="Search your watchlist..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <select
        className="asset-type-select"
        aria-label="Filter by asset type"
        value={type}
        onChange={(event) => setType(event.target.value)}
      >
        {TYPES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <SortSelect value={sort} onChange={setSort} options={ALL_SORTS} />
    </section>
  );

  return { toolbar, visible, prices };
}
