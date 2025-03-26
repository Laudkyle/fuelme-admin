import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DataTable from "react-data-table-component";
import { Users, CreditCard, Banknote, Layers } from "lucide-react";
import api from "../api"; // Import api.js

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    transactions: 0,
    loans: 0,
    payments: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loanStatusData, setLoanStatusData] = useState([]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/dashboard");
        const data = response.data;

        setStats(data.stats);
        setTransactions(data.recentTransactions);

        // Convert "Month 3" to "March"
        const formattedChartData = data.transactionChart.map((item) => {
          const monthNumber = parseInt(item.month.replace("Month ", "")); // Extract number
          return {
            ...item,
            month: monthNames[monthNumber - 1], // Convert to month name
          };
        });

        setChartData(formattedChartData);
        setLoanStatusData(data.loanStatusChart);
        console.log("Formatted Chart Data:", formattedChartData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    }
    fetchDashboardData();
  }, []);

  // Loan status colors
  const COLORS = ["#4CAF50", "#FF9800", "#F44336"];

  // Table columns
  const columns = [
    { name: "Transaction ID", selector: (row) => row.transaction_uuid, sortable: true },
    { name: "User", selector: (row) => row.name, sortable: true },
    { name: "Amount", selector: (row) => `$${row.amount}`, sortable: true },
    { name: "Type", selector: (row) => row.type, sortable: true },
    { name: "Date", selector: (row) => new Date(row.datetime).toLocaleDateString(), sortable: true },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Users" value={stats.users} icon={<Users size={24} />} />
        <StatCard title="Transactions" value={stats.transactions} icon={<Layers size={24} />} />
        <StatCard title="Loans" value={stats.loans} icon={<Banknote size={24} />} />
        <StatCard title="Payments" value={stats.payments} icon={<CreditCard size={24} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-lg font-bold mb-4">Transactions Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="transactions" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-white shadow rounded">
          <h2 className="text-lg font-bold mb-4">Loan Status Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={loanStatusData} dataKey="value" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                {loanStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="p-6 bg-white shadow rounded">
        <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
        <DataTable columns={columns} data={transactions} pagination striped />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon }) => (
  <div className="p-4 bg-white shadow rounded flex items-center gap-4">
    <div className="p-3 bg-gray-100 rounded">{icon}</div>
    <div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-gray-500">{title}</p>
    </div>
  </div>
);

export default Dashboard;
