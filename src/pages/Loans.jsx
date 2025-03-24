import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

const Loans = () => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    // Fetch loans from API (replace with real API)
    fetch("/api/loans")
      .then((res) => res.json())
      .then((data) => setLoans(data))
      .catch((err) => console.error("Error fetching loans:", err));
  }, []);

  const columns = [
    { name: "Loan ID", selector: (row) => row.loan_uuid, sortable: true },
    { name: "User ID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Amount", selector: (row) => `$${row.amount}`, sortable: true },
    { name: "Balance", selector: (row) => `$${row.balance}`, sortable: true },
    { name: "Agent ID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Car ID", selector: (row) => row.car_uuid, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Loans</h2>
      <DataTable columns={columns} data={loans} pagination striped />
    </div>
  );
};

export default Loans;
