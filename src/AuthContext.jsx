import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Try loading user data from localStorage on first load
    const storedUser = localStorage.getItem("userData");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const navigate = useNavigate();

  // Ensure user remains logged in after refresh
  useEffect(() => {
    if (user) {
      localStorage.setItem("userData", JSON.stringify(user));
    }
  }, [user]);

  // Login function
  const login = async (phone, pin) => {
    try {
      const { data } = await api.post("/users/login", { phone, pin });

      // Store user in state and localStorage
      setUser(data);
      localStorage.setItem("userData", JSON.stringify(data));
      
      navigate("/admin/dashboard");
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed.");
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("userData");
    setUser(null);
    navigate("/admin/login");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
