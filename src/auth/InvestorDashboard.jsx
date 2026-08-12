import { Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import UserWatchList from "./UserWatchList";

export default function InvestorDashboard() {
  const { user } = useAuth();

  const displayName =
    user?.Name ||
    user?.name ||
    user?.username ||
    "Investor";

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div className="dashboard-welcome">
          <p className="eyebrow">
            YOUR MARKET WORKSPACE
          </p>

          <h1>
            Welcome back,
            <br />
            {displayName}.
          </h1>

          <p className="dashboard-subtitle">
            Track your investor assets, review your
            watchlist, and keep up with the market.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <Link
            className="dashboard-action"
            to="/stocks"
          >
            Explore markets
          </Link>

          <button
            type="button"
            className="outline-button"
            onClick={() =>
              alert("AI assistant coming soon.")
            }
          >
            AI Assistant
          </button>

          
        </div>
      </section>

      <section className="dashboard-content dashboard-single-column">
        <section className="dashboard-section watchlist-dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">YOUR ASSETS</p>
              <h2>Watchlist</h2>
            </div>

            <Link to="/watchlist">
              View all →
            </Link>
          </div>

          <UserWatchList
            limit={3}
            compact={true}
          />
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">MARKET ALERTS</p>
              <h2>Stay informed</h2>
            </div>

            <button
              type="button"
              className="outline-button"
              onClick={() =>
                alert("Alert settings coming soon.")
              }
            >
              Alert settings
            </button>
          </div>

          <div className="alert-panel">
            <div className="alert-panel-icon">
              ⌁
            </div>

            <div className="alert-panel-content">
              <h3>Price movement alerts</h3>

              <p>
                Receive alerts when assets in your watchlist
                increase or decrease significantly.
              </p>

              <span className="alert-status">
                Alerts will be connected to the backend
                shortly.
              </span>
            </div>
          </div>
        </section>

        <section
          id="latest-news"
          className="dashboard-section"
        >
          
        </section>
      </section>
    </main>
  );
}