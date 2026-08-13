import { NAME_SORTS } from "./assetFilters";

export default function SortSelect({ value, onChange, options = NAME_SORTS }) {
  return (
    <select
      className="asset-type-select asset-sort-select"
      aria-label="Sort assets"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
