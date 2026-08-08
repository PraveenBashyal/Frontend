import {
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./auth/Navbar";

import Home from "./auth/Home";
import InvestorDashboard from "./auth/InvestorDashboard";
import Login from "./auth/Login";
import Register from "./auth/Register";
import Profile from "./auth/Profile";
import News from "./auth/News";
import Stocks from "./auth/Stocks";
import UserWatchlist from "./auth/UserWatchlist";
import StockDetail from "./auth/StockDetail";

function AppLayout() {
  const location = useLocation();

  const pagesWithoutNavbar = [
    "/",
    "/home",
    "/login",
    "/register",
  ];

  const hideNavbar = pagesWithoutNavbar.includes(
    location.pathname
  );

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/home"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<InvestorDashboard />}
        />

        <Route
          path="/news"
          element={<News />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/stocks"
          element={<Stocks />}
        />

        <Route
          path="/watchlist"
          element={<UserWatchlist />}
        />

        <Route
          path="/stock/:symbol"
          element={<StockDetail />}
        />
      </Route>
    </Routes>
  );
}