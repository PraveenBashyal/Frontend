import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchAlerts, ALERTS_CHANGED } from '../../data'
import { useAuth } from '../../api/AuthContext'
import { OPEN_TUTORIAL } from './TutorialPopup'

// Primary items. Profile, Help and Logout sit below the divider.
const navItems = [
  { label: 'Dashboard', path: '/InvestorDashboard' },
  { label: 'Watchlist', path: '/UserWatchList' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Alerts',    path: '/alerts' },
]

// data-tour is what the guided tour points at
function NavItem({ label, active, badge, onClick }) {
  return (
    <div
      className={`nav-item${active ? ' nav-item--active' : ''}`}
      data-tour={`nav-${label.toLowerCase()}`}
      onClick={onClick}
    >
      <span>{label}</span>
      {badge > 0 && <span className="nav-item__dot" title={`${badge} unread`} />}
    </div>
  )
}

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { removeToken } = useAuth()

  const [unread, setUnread] = useState(0)

  // Unread dot on the Alerts entry. Recounts on navigation and on
  // alerts-changed, so it clears without leaving the page.
  useEffect(() => {
    let cancelled = false

    async function countUnread() {
      try {
        const alerts = await fetchAlerts()
        if (!cancelled) setUnread(alerts.filter(a => !a.read).length)
      } catch {
        if (!cancelled) setUnread(0)
      }
    }

    countUnread()
    window.addEventListener(ALERTS_CHANGED, countUnread)
    return () => {
      cancelled = true
      window.removeEventListener(ALERTS_CHANGED, countUnread)
    }
  }, [location.pathname])

  function handleLogout() {
    removeToken()
    navigate('/login')
  }

  return (
    <div className="sidebar">
      <div className="sidebar__group">
        <div className="section-title sidebar__label">Menu</div>
        {navItems.map(item => (
          <NavItem
            key={item.path}
            label={item.label}
            active={location.pathname === item.path}
            badge={item.path === '/alerts' ? unread : 0}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>

      <div className="sidebar__footer">
        <NavItem
          label="Profile"
          active={location.pathname === '/profile'}
          badge={0}
          onClick={() => navigate('/profile')}
        />
        <NavItem
          label="Help"
          active={false}
          badge={0}
          onClick={() => window.dispatchEvent(new Event(OPEN_TUTORIAL))}
        />
        <NavItem label="Logout" active={false} badge={0} onClick={handleLogout} />
      </div>
    </div>
  )
}
