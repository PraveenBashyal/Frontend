import { ASSET_TYPES, SORT_OPTIONS } from '../../data'

// Search, type filter and sort selector for the asset tables
export default function AssetControls({
  query, onQuery,
  type,  onType,
  sort,  onSort,
  showSearch = true,
  tourId,
}) {
  return (
    <div className="controls" data-tour={tourId}>
      {showSearch && (
        <div className="filter-input">
          <input
            value={query}
            onChange={e => onQuery(e.target.value)}
            placeholder="Filter by ticker or name…"
            aria-label="Filter assets"
          />
        </div>
      )}

      <div className="filter-group" role="group" aria-label="Filter by market type">
        {ASSET_TYPES.map(t => (
          <button
            key={t}
            className={`filter-btn${type === t ? ' filter-btn--active' : ''}`}
            onClick={() => onType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <label className="controls__sort">
        <span className="controls__sort-label">Sort</span>
        <select
          className="select"
          value={sort}
          onChange={e => onSort(e.target.value)}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
