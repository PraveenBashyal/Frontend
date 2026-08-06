import {
  useState,
  useContext,
  createContext,
} from "react";

import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const savedToken = localStorage.getItem("accessToken");

  const [AccessToken, setAccessToken] = useState(
    savedToken || ""
  );

  const [user, setUser] = useState(() => {
    if (!savedToken) {
      return null;
    }

    try {
      return jwtDecode(savedToken);
    } catch (error) {
      console.error("Invalid saved token:", error);
      localStorage.removeItem("accessToken");
      return null;
    }
  });

  function saveToken(data) {
    const token = data?.AccessToken;

    if (!token) {
      console.error("No AccessToken was returned by the backend.");
      return;
    }

    try {
      const decodedUser = jwtDecode(token);

      setAccessToken(token);
      setUser(decodedUser);

      localStorage.setItem("accessToken", token);
    } catch (error) {
      console.error("Could not decode token:", error);
    }
  }

  function removeToken() {
    localStorage.removeItem("accessToken");

    setAccessToken("");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        saveToken,
        removeToken,
        AccessToken,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}