import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Layout from "./Layout";
import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Cards from "./pages/Cards";
import Momo from "./pages/Momo";
import Transactions from "./pages/Transactions";
import Loans from "./pages/Loans";
import RepaymentSchedules from "./pages/RepaymentSchedules";
import Agents from "./pages/Agents";
import Users from "./pages/UserProfiles";
import Cars from "./pages/Cars";
import Stations from "./pages/Stations";
import Banks from "./pages/Banks";
import Requests from "./pages/Requests";
import Login from "./pages/Login";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/payments" element={<Payments />} />
              <Route path="/admin/cards" element={<Cards />} />
              <Route path="/admin/momo" element={<Momo />} />
              <Route path="/admin/transactions" element={<Transactions />} />
              <Route path="/admin/loans" element={<Loans />} />
              <Route path="/admin/repayment" element={<RepaymentSchedules />} />
              <Route path="/admin/agents" element={<Agents />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/cars" element={<Cars />} />
              <Route path="/admin/stations" element={<Stations />} />
              <Route path="/admin/banks" element={<Banks />} />
              <Route path="/admin/requests" element={<Requests />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}
