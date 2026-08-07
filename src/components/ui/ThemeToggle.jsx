import { useState, useEffect } from 'react'
import { PALETTE_CHANGED } from '../charts/chartTheme'

// Dark is the default (plain :root); the others set data-palette on <html>.
// Terminal is the previous dark palette, kept for comparison.
const DEFAULT_THEME = 'dark'

const THEMES = [
  { id: 'light',    label: 'Light'    },
  { id: 'dark',     label: 'Dark'     },
  { id: 'terminal', label: 'Terminal' },
]

const STORAGE_KEY = 'uiPalette'

function readStored() {
  const stored = localStorage.getItem(STORAGE_KEY)
  // Ignore unknown values left by older builds
  return THEMES.some(t => t.id === stored) ? stored : DEFAULT_THEME
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(readStored)

  useEffect(() => {
    if (theme === DEFAULT_THEME) {
      delete document.documentElement.dataset.palette
    } else {
      document.documentElement.dataset.palette = theme
    }
    localStorage.setItem(STORAGE_KEY, theme)
    // Charts read their colours from CSS, so they need a nudge
    window.dispatchEvent(new Event(PALETTE_CHANGED))
  }, [theme])

  return (
    <div className="theme-toggle" role="group" aria-label="Colour theme">
      {THEMES.map(t => (
        <button
          key={t.id}
          className={`theme-toggle__btn${theme === t.id ? ' theme-toggle__btn--active' : ''}`}
          onClick={() => setTheme(t.id)}
          aria-pressed={theme === t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
