import { Routes, Route, Navigate, useParams } from "react-router-dom"
import { useAuth } from "./api/AuthContext"

// ─── Praveen's pages, unchanged ───────────────────────────────
import Login from "./auth/Login"
import Register from "./auth/Register"
import ProtectedRoute from "./auth/ProtectedRoute"
import Asset from "./auth/Asset"
import SearchStocks from "./auth/Stocks"

// ─── Bao's pages ──────────────────────────────────────────────
import HomePage from "./pages/HomePage"
import HubPage from "./pages/HubPage"
import DashboardPage from "./pages/DashboardPage"
import WatchlistPage from "./pages/WatchlistPage"
import StockDetailPage from "./pages/StockDetailPage"
import AlertsPage from "./pages/AlertsPage"
import PortfolioPage from "./pages/PortfolioPage"
import ComparePage from "./pages/ComparePage"
import ProfilePage from "./pages/ProfilePage"
import TutorialPopup from "./components/ui/TutorialPopup"
import ChatPanel from "./components/ui/ChatPanel"

// key=symbol remounts the page when the ticker changes, resetting its state
function StockDetailRoute() {
   const { symbol } = useParams()
   return <StockDetailPage key={symbol} />
}

// Skip /login and /register when already signed in
function RedirectIfAuthed({ children }) {
   const { AccessToken } = useAuth()
   if (AccessToken) return <Navigate to="/home" replace />
   return children
}

export default function App() {
   const { AccessToken } = useAuth()
   const fallback = AccessToken ? "/home" : "/"

   return (
      <>
      <Routes>
         <Route path="/" element={<HomePage />} />

         <Route path="/login" element={
            <RedirectIfAuthed><Login /></RedirectIfAuthed>
         } />
         <Route path="/register" element={
            <RedirectIfAuthed><Register /></RedirectIfAuthed>
         } />

         {/* Login.jsx sends users to /dashboard and ProtectedRoute sends
             them to /Login, so both are kept working as redirects rather
             than editing those files. */}
         <Route path="/Login"     element={<Navigate to="/login" replace />} />
         <Route path="/dashboard" element={<Navigate to="/home"  replace />} />

         <Route path="/home" element={
            <ProtectedRoute><HubPage /></ProtectedRoute>
         } />
         <Route path="/InvestorDashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
         } />
         <Route path="/UserWatchList" element={
            <ProtectedRoute><WatchlistPage /></ProtectedRoute>
         } />
         <Route path="/stock/:symbol" element={
            <ProtectedRoute><StockDetailRoute /></ProtectedRoute>
         } />
         <Route path="/alerts" element={
            <ProtectedRoute><AlertsPage /></ProtectedRoute>
         } />
         <Route path="/portfolio" element={
            <ProtectedRoute><PortfolioPage /></ProtectedRoute>
         } />
         <Route path="/compare" element={
            <ProtectedRoute><ComparePage /></ProtectedRoute>
         } />
         <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
         } />

         {/* Praveen's earlier screens, still reachable */}
         <Route path="/asset" element={<Asset />} />
         <Route path="/SearchStocks" element={<SearchStocks />} />

         <Route path="*" element={<Navigate to={fallback} replace />} />
      </Routes>

      {/* Outside Routes so they survive navigation */}
      <TutorialPopup />
      <ChatPanel />
      </>
   )
}
