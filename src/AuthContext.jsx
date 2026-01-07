import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Admin frontend primarily authenticates with an admin API key.
    // For backwards compatibility, we also load any existing userData.
    const adminApiKey = localStorage.getItem("adminApiKey");
    if (adminApiKey) return { adminApiKey };

    const storedUser = localStorage.getItem("userData");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const navigate = useNavigate();

  // Ensure user remains logged in after refresh
  useEffect(() => {
    if (user) {
      // Prefer storing adminApiKey separately.
      if (user.adminApiKey) {
        localStorage.setItem("adminApiKey", user.adminApiKey);
      } else {
        localStorage.setItem("userData", JSON.stringify(user));
      }
    }
  }, [user]);

  // Login function (Admin API Key)
  // The backend's admin-protected routes accept x-admin-api-key.
  const login = async (adminApiKey) => {
    if (!adminApiKey || adminApiKey.trim().length < 8) {
      throw new Error("Please enter a valid Admin API Key.");
    }

    const trimmed = adminApiKey.trim();
    localStorage.setItem("adminApiKey", trimmed);
    // Do not persist phone/pin tokens here; admin auth is header-based.
    localStorage.removeItem("userData");
    setUser({ adminApiKey: trimmed });
    navigate("/admin/dashboard");
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("adminApiKey");
    localStorage.removeItem("userData");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
