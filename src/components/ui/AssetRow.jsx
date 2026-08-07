// One row in an asset table. Renders the asset and price columns; the rest
// come from children. `columns` is a CSS grid template.
export default function AssetRow({ asset, columns, onClick, children }) {
  return (
    <div className="asset-row" style={{ '--cols': columns }}>
      <div
        className={`asset-row__identity${onClick ? ' asset-row__identity--clickable' : ''}`}
        onClick={onClick}
      >
        <div className="symbol-avatar symbol-avatar--md">
          {asset.symbol?.[0]}
        </div>
        <div className="min-w-0">
          <div className="asset-row__name">{asset.symbol}</div>
          <div className="subtext">{asset.name} · {asset.type}</div>
        </div>
      </div>

      <div className={`asset-row__price${asset.price === null ? ' asset-row__price--empty' : ''}`}>
        {asset.price === null ? '—' : `$${asset.price.toLocaleString()}`}
      </div>

      {children}
    </div>
  )
}
