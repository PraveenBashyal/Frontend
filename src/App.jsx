import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./api/AuthContext";
import InvestorDashboard from "./auth/InvestorDashboard";
import Register from "./auth/Register";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./auth/Login";
import SearchStocks from "./auth/Stocks";
import UserWatchList from "./auth/UserWatchList";
import StockDetail from "./auth/StockDetail";
import Navbar from "./auth/Navbar";

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  const { AccessToken } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          AccessToken ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <InvestorDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SearchStocks />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <AppLayout>
              <UserWatchList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/stock/:symbol"
        element={
          <ProtectedRoute>
            <AppLayout>
              <StockDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}