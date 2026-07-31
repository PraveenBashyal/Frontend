import { Navigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";

export default function ProtectedRoute({ children }) {
  const { AccessToken } = useAuth();

  if (!AccessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}