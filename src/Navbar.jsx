import { Menu, LogOut, LogIn } from "lucide-react";
import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar({ setSidebarOpen }) {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      navigate("/admin/login");
    }
  };

  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center">
      <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
        <Menu className="h-6 w-6" />
      </button>
      <h2 className="text-xl font-bold">Dashboard</h2>
      <button 
        onClick={handleAuthAction} 
        className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition"
      >
        {isAuthenticated ? <LogOut className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
        <span className="hidden md:inline text-sm font-medium">
          {isAuthenticated ? "Logout" : "Login"}
        </span>
      </button>
    </div>
  );
}
