import { Menu, UserCircle } from "lucide-react";

export default function Navbar({ setSidebarOpen }) {
  return (
    <div className="bg-white shadow-md p-4 flex justify-between items-center">
      <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
        <Menu className="h-6 w-6" />
      </button>
      <h2 className="text-xl font-bold">Dashboard</h2>
      <UserCircle className="h-8 w-8 text-gray-500" />
    </div>
  );
}
