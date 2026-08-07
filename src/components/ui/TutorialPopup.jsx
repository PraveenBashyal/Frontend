import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../api/AuthContext'

// Guided tour for first-time users (FR-08). Each step opens the screen it
// describes and highlights the matching element.
// Must be rendered outside <Routes>, otherwise navigating between steps
// unmounts it and the tour restarts.
export const OPEN_TUTORIAL = 'open-tutorial'

const SEEN_KEY = 'tutorialSeen'
const DASHBOARD_PATH = '/InvestorDashboard'

// path: route to open. anchor: data-tour value to highlight.
// placement: where the bubble sits relative to the highlight.
const STEPS = [
  {
    title: 'Welcome to SentiMarket',
    body: 'We read social posts and financial news, score the mood behind '
        + 'them, and turn that into a short-term view on stocks, ETFs and '
        + 'crypto. This tour takes about 30 seconds.',
    path: '/InvestorDashboard',
  },
  {
    title: 'Dashboard',
    body: 'Every tracked asset with its price, market, mood and predicted '
        + 'movement. The cards along the top summarise the whole market.',
    path:      '/InvestorDashboard',
    anchor:    'nav-dashboard',
    placement: 'right',
  },
  {
    title: 'Filter and sort',
    body: 'Narrow the table to stocks, ETFs or crypto, search by ticker or '
        + 'company name, and rank by sentiment score or predicted movement.',
    path:      '/InvestorDashboard',
    anchor:    'dashboard-controls',
    placement: 'bottom',
  },
  {
    title: 'Watchlist',
    body: 'The assets you follow, sorted by sentiment so the strongest '
        + 'signals sit on top. Add one from any asset page, remove it here.',
    path:      '/UserWatchList',
    anchor:    'nav-watchlist',
    placement: 'right',
  },
  {
    title: 'Asset detail',
    body: 'Click any row to open an asset. You get a price chart, the '
        + 'sentiment trend against the bullish and bearish thresholds, '
        + 'recent headlines, and a button to re-run the analysis.',
    path:      '/stock/AAPL',
    anchor:    'asset-charts',
    placement: 'top',
  },
  {
    title: 'Alerts',
    body: 'When sentiment shifts sharply an alert is recorded, and a red '
        + 'dot appears here in the menu. Open the page to see what moved.',
    path:      '/alerts',
    anchor:    'nav-alerts',
    placement: 'right',
  },
]

const BUBBLE_WIDTH = 380
const GAP = 16
const EDGE = 16

// Clamps the bubble inside the viewport
function positionFor(rect, placement) {
  const clampLeft = left =>
    Math.max(EDGE, Math.min(left, window.innerWidth - BUBBLE_WIDTH - EDGE))

  switch (placement) {
    case 'bottom':
      return { top: rect.bottom + GAP, left: clampLeft(rect.left) }
    case 'top':
      return { bottom: window.innerHeight - rect.top + GAP, left: clampLeft(rect.left) }
    default:
      return { top: Math.max(EDGE, rect.top - 8), left: clampLeft(rect.right + GAP) }
  }
}

export default function TutorialPopup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { AccessToken } = useAuth()

  // Read on init so the first render already knows whether to open
  const [open, setOpen] = useState(() => !localStorage.getItem(SEEN_KEY))
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState(null)

  const current = STEPS[step]

  const close = useCallback(() => {
    localStorage.setItem(SEEN_KEY, 'true')
    setOpen(false)
    setStep(0)
    setRect(null)
  }, [])

  // Finishing returns to the dashboard, not the last step's page
  const finish = useCallback(() => {
    close()
    navigate(DASHBOARD_PATH)
  }, [close, navigate])

  // Reopen whenever Help is clicked in the sidebar
  useEffect(() => {
    const reopen = () => { setStep(0); setOpen(true) }
    window.addEventListener(OPEN_TUTORIAL, reopen)
    return () => window.removeEventListener(OPEN_TUTORIAL, reopen)
  }, [])

  // Open the screen this step is about
  useEffect(() => {
    if (!open || !AccessToken) return
    if (current.path && location.pathname !== current.path) {
      navigate(current.path)
    }
  }, [open, step, current.path, location.pathname, navigate, AccessToken])

  // Measure the highlighted element, retrying while the page loads.
  // Gives up after 3s and leaves the bubble centred.
  useEffect(() => {
    if (!open || !current.anchor) return

    // setTimeout, not rAF — rAF does not fire in a background tab
    let timer
    let cancelled = false
    const deadline = Date.now() + 3000

    // Tag the rect with its anchor so a stale one can be spotted on render
    const read = el => {
      const box = el.getBoundingClientRect()
      return {
        anchor: current.anchor,
        top:    box.top,
        left:   box.left,
        right:  box.right,
        bottom: box.bottom,
        width:  box.width,
        height: box.height,
      }
    }

    const measure = () => {
      if (cancelled) return
      const el = document.querySelector(`[data-tour="${current.anchor}"]`)
      if (el) {
        setRect(read(el))
      } else if (Date.now() < deadline) {
        timer = setTimeout(measure, 50)
      }
    }

    // Deferred so the effect body never calls setState directly
    timer = setTimeout(measure, 0)

    const remeasure = () => {
      const el = document.querySelector(`[data-tour="${current.anchor}"]`)
      if (el) setRect(read(el))
    }
    window.addEventListener('resize', remeasure)

    return () => {
      cancelled = true
      clearTimeout(timer)
      window.removeEventListener('resize', remeasure)
    }
  }, [open, step, current.anchor, location.pathname])

  // Escape closes, arrows move between steps
  useEffect(() => {
    if (!open) return

    function onKeyDown(e) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') setStep(s => Math.min(s + 1, STEPS.length - 1))
      if (e.key === 'ArrowLeft')  setStep(s => Math.max(s - 1, 0))
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  // Only runs once signed in
  if (!open || !AccessToken) return null

  const isLast    = step === STEPS.length - 1
  // Anchored only when the rect belongs to the current step
  const anchored  = Boolean(current.anchor) && rect?.anchor === current.anchor
  const placement = current.placement || 'right'

  return (
    <div
      className={`tour-overlay${anchored ? ' tour-overlay--anchored' : ''}`}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      {anchored && (
        // Its spread shadow dims the page and leaves this area clear
        <div
          className="tour-ring"
          style={{
            top:    rect.top - 4,
            left:   rect.left - 4,
            width:  rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      <div
        className={
          anchored
            ? `modal modal--anchored modal--${placement}`
            : 'modal modal--centred'
        }
        style={anchored ? positionFor(rect, placement) : undefined}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__step">Step {step + 1} of {STEPS.length}</div>
        <div className="modal__title" id="tutorial-title">{current.title}</div>
        <div className="modal__body">{current.body}</div>

        <div className="modal__dots">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              className={`modal__dot${i === step ? ' modal__dot--active' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        <div className="modal__actions">
          <button className="btn btn--outline btn--sm" onClick={close}>
            {isLast ? 'Close' : 'Skip'}
          </button>

          <div className="modal__nav">
            {step > 0 && (
              <button
                className="btn btn--outline btn--sm"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <button
              className="btn btn--primary btn--sm"
              onClick={() => (isLast ? finish() : setStep(step + 1))}
            >
              {isLast ? 'Get started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
