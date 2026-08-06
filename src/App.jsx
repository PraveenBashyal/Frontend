import { Routes, Route } from "react-router-dom";
import { useAuth } from "./api/AuthContext";

import Home from "./auth/Home";
import Login from "./auth/Login";
import Register from "./auth/Register";
import Navbar from "./auth/Navbar";
import ProtectedRoute from "./auth/ProtectedRoute";

import InvestorDashboard from "./auth/InvestorDashboard";
import Asset from "./auth/Asset";
import SearchStocks from "./auth/Stocks";
import UserWatchList from "./auth/UserWatchList";
import StockDetail from "./auth/StockDetail";

export default function App() {
  const { AccessToken, isReady } = useAuth();

  return (
    <>
      {isReady && AccessToken && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <InvestorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/asset"
          element={
            <ProtectedRoute>
              <Asset />
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchStocks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/watchlist"
          element={
            <ProtectedRoute>
              <UserWatchList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stock/:symbol"
          element={
            <ProtectedRoute>
              <StockDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}