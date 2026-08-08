import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../api/AuthContext";

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
      >
        MARKET INTELLIGENCE PLATFORM
      </Link>

      <div className="main-nav-links">
        <Link to="/news">
          News
        </Link>

        <Link to="/stocks">
          Explore markets
        </Link>

        <Link to="/watchlist">
          Watchlist
        </Link>
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