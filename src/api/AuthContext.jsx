import { useState, useContext, createContext, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [AccessToken, setAccessToken] = useState(
    localStorage.getItem("accessToken") || null
  );

  useEffect(() => {
    if (AccessToken) {
      try {
        const decoded = jwtDecode(AccessToken);
        setUser(decoded);
      } catch (error) {
        console.log(error);
        removeToken();
      }
    }
  }, [AccessToken]);

  const saveToken = (data) => {
    const token = data.AccessToken;
    setAccessToken(token);
    localStorage.setItem("accessToken", token);

    try {
      const decoded = jwtDecode(token);
      setUser(decoded);
    } catch (error) {
      console.log(error);
    }
  };

  const removeToken = () => {
    localStorage.removeItem("accessToken");
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, AccessToken, saveToken, removeToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}