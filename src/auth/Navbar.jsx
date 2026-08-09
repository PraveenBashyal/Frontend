import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../api/AuthContext";

// ── Bao ── the three blocks marked below are the only additions to this
// file: the Tools menu, the Help and Assistant buttons, and the
// data-tour attributes the guided tour points at. Everything else is
// Praveen's. Styles for them live under the divider in index.css.
import { OPEN_CHAT } from "../features/assistant/ChatPanel";
import { OPEN_TUTORIAL } from "../features/tutorial/TutorialPopup";

// Screens that live under the Tools menu
const TOOLS = [
  { to: "/portfolio", label: "Portfolio", hint: "Track what you bought" },
  { to: "/compare",   label: "Compare",   hint: "Two assets side by side" },
];

export default function Navbar() {
  const { user } = useAuth();

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  const displayName =
    user?.Name ||
    user?.name ||
    user?.username ||
    "Investor";

  useEffect(() => {
    document.body.classList.remove(
      "dark-theme",
      "light-theme"
    );

    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark"
    );
  };

  return (
    <nav className="app-navbar">
      <Link
        to="/dashboard"
        className="brand-logo"
        data-tour="brand"
      >
        MARKET INTELLIGENCE PLATFORM
      </Link>

      <div className="main-nav-links">
        <Link to="/news" data-tour="news">
          News
        </Link>

        <Link to="/stocks" data-tour="explore">
          Explore markets
        </Link>

        <Link to="/watchlist" data-tour="watchlist">
          Watchlist
        </Link>

        {/* ── Bao: Tools menu ── start ───────────────────────────
            Opens on hover, and on focus so it can be reached by keyboard.
            New screens go in the TOOLS array at the top of this file,
            not here. */}
        <div className="tools-menu" data-tour="tools">
          <button
            type="button"
            className="tools-trigger"
            aria-haspopup="true"
          >
            Tools
            <span className="tools-caret">▾</span>
          </button>

          <div className="tools-dropdown">
            {TOOLS.map((tool) => (
              <Link
                to={tool.to}
                key={tool.to}
                className="tools-item"
              >
                <strong>{tool.label}</strong>
                <span>{tool.hint}</span>
              </Link>
            ))}
          </div>
        </div>
        {/* ── Bao: Tools menu ── end ─────────────────────────────── */}
      </div>

      <div className="navbar-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Switch colour theme"
          title={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
        >
          <span className="theme-icon">
            {theme === "dark" ? "☾" : "☀"}
          </span>

          <span
            className={`theme-switch ${
              theme === "light"
                ? "theme-switch-light"
                : ""
            }`}
          >
            <span className="theme-switch-knob" />
          </span>
        </button>

        {/* ── Bao: Help and Assistant ── start ──────────────────────
            Both open a panel rendered from App.jsx, so they only fire an
            event rather than routing anywhere. */}
        <button
          type="button"
          className="help-button"
          data-tour="help"
          onClick={() => window.dispatchEvent(new Event(OPEN_TUTORIAL))}
          title="Replay the guided tour"
        >
          Help
        </button>

        <button
          type="button"
          className="assistant-button"
          data-tour="assistant"
          onClick={() => window.dispatchEvent(new Event(OPEN_CHAT))}
          title="Ask the assistant about your holdings"
        >
          Assistant
        </button>
        {/* ── Bao: Help and Assistant ── end ────────────────────────── */}

        <Link
          to="/profile"
          className="profile-button"
        >
          <span className="profile-avatar">
            {displayName.charAt(0).toUpperCase()}
          </span>

          <span className="profile-name">
            {displayName}
          </span>
        </Link>
      </div>
    </nav>
  );
}