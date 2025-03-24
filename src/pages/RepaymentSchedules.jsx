import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

const RepaymentSchedules = () => {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    // Fetch repayment schedules from API (replace with real API)
    fetch("/api/repayments")
      .then((res) => res.json())
      .then((data) => setSchedules(data))
      .catch((err) => console.error("Error fetching repayments:", err));
  }, []);

  const columns = [
    { name: "Repayment ID", selector: (row) => row.repayment_schedule_uuid, sortable: true },
    { name: "Loan ID", selector: (row) => row.loan_uuid, sortable: true },
    { name: "Due Date", selector: (row) => new Date(row.due_date).toLocaleDateString(), sortable: true },
    { name: "Frequency", selector: (row) => row.repayment_frequency, sortable: true },
    { name: "Amount Due", selector: (row) => `$${row.total_amount_due}`, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Repayment Schedules</h2>
      <DataTable columns={columns} data={schedules} pagination striped />
    </div>
  );
};

export default RepaymentSchedules;
