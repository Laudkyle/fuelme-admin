import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch("/api/payments");
        const data = await res.json();
        setPayments(data);
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };
    fetchPayments();
  }, []);

  const columns = [
    { name: "Payment UUID", selector: (row) => row.payment_uuid, sortable: true },
    { name: "Loan UUID", selector: (row) => row.loan_uuid, sortable: true },
    { name: "Amount", selector: (row) => `$${row.amount.toFixed(2)}`, sortable: true },
    { name: "Date", selector: (row) => new Date(row.datetime).toLocaleDateString(), sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <button className="text-blue-500 mr-2">Edit</button>
          <button className="text-red-500">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Payments</h1>
      <DataTable columns={columns} data={payments} pagination highlightOnHover />
    </div>
  );
}
