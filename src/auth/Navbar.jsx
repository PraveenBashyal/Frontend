import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, removeToken } = useAuth();

  function handleLogout() {
    removeToken();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-links">
          <Link to="/dashboard" className="navbar-brand">
            Capstone
          </Link>
          <Link to="/search" className="nav-link">
            Search
          </Link>
          <Link to="/watchlist" className="nav-link">
            Watchlist
          </Link>
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
        </div>

        <div className="navbar-user">
          <span className="user-badge">
            {user?.Name || user?.username || "Investor"}
          </span>
          <button className="btn btn-danger" type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}