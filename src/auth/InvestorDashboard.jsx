import { Link } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import SearchStocks from "./Stocks";
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
        <div>
          <p className="eyebrow">YOUR MARKET WORKSPACE</p>

          <h1>
            Welcome back,
            <br />
            {displayName}.
          </h1>

          <p className="dashboard-subtitle">
            Follow the market, discover opportunities, and keep your
            watchlist organised.
          </p>
        </div>

        <Link className="dashboard-action" to="/search">
          Explore markets
        </Link>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">MARKET ALERTS</p>
            <h2>Stay informed</h2>
          </div>

          <button type="button" className="alert-settings-button">
            Alert settings
          </button>
        </div>

        <div className="alert-panel">
          <div className="alert-panel-icon">⌁</div>

          <div className="alert-panel-content">
            <h3>Price movement alerts</h3>

            <p>
              Receive an alert when an asset in your watchlist increases
              or decreases significantly.
            </p>

            <span className="alert-status">
              Alerts add garam la.
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-content">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">DISCOVER</p>
            <h2>Search the market</h2>
          </div>

          <Link to="/search">
            View full search →
          </Link>
        </div>

        <SearchStocks />
      </section>

      <section className="dashboard-content">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">YOUR ASSETS</p>
            <h2>Watchlist</h2>
          </div>

          <Link to="/watchlist">
            View full watchlist →
          </Link>
        </div>

        <UserWatchList />
      </section>

      <section className="dashboard-content ai-placeholder-section">
        <div className="dashboard-section-heading">
          <div>
            <p className="eyebrow">COMING SOON</p>
            <h2>AI market assistant</h2>
          </div>
        </div>

        <div className="ai-placeholder">
          <div className="ai-placeholder-icon">✦</div>

          <div>
            <h3>Hamro AI xittai aunxa</h3>
            <p>
              Ask questions about markets, sentiment, news, and your
              watchlist when the backend feature is ready.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}