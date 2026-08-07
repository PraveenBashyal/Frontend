import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAssets, USE_MOCK } from '../../data'
import { useAuth } from '../../api/AuthContext'
import ThemeToggle from './ThemeToggle'
import { OPEN_CHAT } from './ChatPanel'

export default function Navbar() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const displayName = user?.name || user?.sub || user?.username || 'User'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showing, setShowing] = useState(false)

  // Debounced search: fires 250ms after typing stops
  useEffect(() => {
    const q = query.trim()
    let cancelled = false

    const timer = setTimeout(async () => {
      if (!q) {
        if (!cancelled) {
          setResults([])
          setShowing(false)
        }
        return
      }

      try {
        const found = await searchAssets(q)
        if (!cancelled) {
          setResults(found)
          setShowing(true)
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Search failed:', err)
          setResults([])
          setShowing(true)
        }
      }
    }, q ? 250 : 0)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  function goToAsset(symbol) {
    setQuery('')
    setResults([])
    setShowing(false)
    navigate(`/stock/${symbol}`)
  }

  return (
    <nav className="navbar">
      <div className="navbar__logo" onClick={() => navigate('/home')}>
        SentiMarket
      </div>

      <div className="search">
        <div className={`search__box${showing ? ' search__box--open' : ''}`}>
          <input
            className="search__input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => setTimeout(() => setShowing(false), 150)}
            onFocus={() => query && setShowing(true)}
            placeholder="Search assets..."
          />
          {query && (
            <span
              className="search__clear"
              onClick={() => { setQuery(''); setResults([]); setShowing(false) }}
            >
              ×
            </span>
          )}
        </div>

        {showing && (
          <div className="search__dropdown">
            {results.length === 0 ? (
              <div className="search__empty">No assets found for "{query}"</div>
            ) : (
              results.map((asset, i) => (
                <div
                  key={asset.symbol || i}
                  className="search__item"
                  onMouseDown={() => goToAsset(asset.symbol)}
                >
                  <div className="symbol-avatar symbol-avatar--sm">
                    {asset.symbol?.[0]}
                  </div>

                  <div className="search__meta">
                    <div className="search__symbol">{asset.symbol}</div>
                    <div className="subtext">{asset.name} · {asset.type}</div>
                  </div>

                  {asset.price !== null && (
                    <div className="search__price">
                      ${asset.price.toLocaleString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="navbar__spacer" />

      <button
        className="btn btn--surface btn--sm"
        onClick={() => window.dispatchEvent(new Event(OPEN_CHAT))}
      >
        Assistant
      </button>

      <ThemeToggle />

      {USE_MOCK && <div className="tag">MOCK DATA</div>}

      <div
        className="navbar__avatar"
        title={`${displayName} — open profile`}
        onClick={() => navigate('/profile')}
      >
        {displayName[0].toUpperCase()}
      </div>
    </nav>
  )
}
