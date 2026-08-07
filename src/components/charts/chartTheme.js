import { useState, useEffect } from 'react'

// Recharts takes colours as props, which CSS classes cannot reach, so read
// the theme.css tokens directly and re-read them when the theme changes.
export const PALETTE_CHANGED = 'palette-changed'

function readTokens() {
  const s = getComputedStyle(document.documentElement)
  const v = (name, fallback) => s.getPropertyValue(name).trim() || fallback

  return {
    up:      v('--up',         '#00d4aa'),
    down:    v('--down',       '#ff4757'),
    flat:    v('--flat',       '#ffa502'),
    accent2: v('--accent2',    '#a29bfe'),
    grid:    v('--border',     '#2a2a4a'),
    axis:    v('--text-dim',   '#555555'),
    tick:    v('--text-muted', '#888888'),
  }
}

export function useChartColors() {
  const [colors, setColors] = useState(readTokens)

  useEffect(() => {
    const update = () => setColors(readTokens())
    window.addEventListener(PALETTE_CHANGED, update)
    return () => window.removeEventListener(PALETTE_CHANGED, update)
  }, [])

  return colors
}

// Must match moodFromScore() in data/viewModels.js
export const BULLISH_AT = 0.6
export const BEARISH_AT = 0.4
