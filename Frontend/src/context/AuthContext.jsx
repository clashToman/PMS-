
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error(
          "Session validation failed:",
          error.response?.data || error.message
        );

        localStorage.removeItem("access_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);

    if (!response.access_token) {
      throw new Error("Access token missing from login response.");
    }

    localStorage.setItem("access_token", response.access_token);

    if (response.user) {
      setUser(response.user);
    } else {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        localStorage.removeItem("access_token");
        throw error;
      }
    }

    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const role = String(
    user?.role ?? user?.user_role ?? ""
  ).toUpperCase();

  const value = {
    user,
    role,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: role === "ADMIN",
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
