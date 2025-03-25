import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, CreditCard, FileText, Settings, Truck, Banknote, Fuel, Layers } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, path: "/admin" },
    { name: "Users", icon: <Users size={20} />, path: "/admin/users" },
    { name: "Agents", icon: <Users size={20} />, path: "/admin/agents" },
    { name: "Cars", icon: <Truck size={20} />, path: "/admin/cars" },
    { name: "Stations", icon: <Fuel size={20} />, path: "/admin/stations" },
    { name: "Banks", icon: <Banknote size={20} />, path: "/admin/banks" },
    { name: "Requests", icon: <FileText size={20} />, path: "/admin/requests" },
    { name: "Payments", icon: <CreditCard size={20} />, path: "/admin/payments" },
    { name: "Cards", icon: <CreditCard size={20} />, path: "/admin/cards" },
    { name: "MOMO", icon: <CreditCard size={20} />, path: "/admin/momo" },
    { name: "Transactions", icon: <Layers size={20} />, path: "/admin/transactions" },
    { name: "Loans", icon: <CreditCard size={20} />, path: "/admin/loans" },
    { name: "Repayment", icon: <CreditCard size={20} />, path: "/admin/repayment" },
    { name: "Settings", icon: <Settings size={20} />, path: "/admin/settings" },
  ];

  return (
    <div className={`h-screen bg-gray-900 overflow-scroll text-white ${expanded ? "w-64" : "w-20"} transition-all`}>
      <div className="p-4 flex justify-between items-center">
        <h1 className={`text-xl font-bold ${expanded ? "block" : "hidden"}`}>FuelMe Admin</h1>
        <button onClick={() => setExpanded(!expanded)} className="p-2 bg-gray-700 rounded">
          {expanded ? "<<" : ">>"}
        </button>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-4 p-3 hover:bg-gray-700 transition ${
              location.pathname === item.path ? "bg-gray-800" : ""
            }`}
          >
            {item.icon}
            <span className={`${expanded ? "block" : "hidden"}`}>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
