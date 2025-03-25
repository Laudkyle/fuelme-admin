// Remove AsyncStorage import since it's not needed in web projects
import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load stored user data on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login function
  const login = async (phone, pin) => {
    try {
      const { data } = await api.post("/users/login", { phone, pin });

      // Store user data in localStorage instead of AsyncStorage
      localStorage.setItem("userData", JSON.stringify(data));
      setUser(data);
      
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
