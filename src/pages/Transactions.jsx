import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
    fetchTransactions();
  }, []);

  const columns = [
    { name: "Transaction UUID", selector: (row) => row.transaction_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Loan UUID", selector: (row) => row.loan_uuid, sortable: true },
    { name: "Amount", selector: (row) => `$${row.amount.toFixed(2)}`, sortable: true },
    { name: "Type", selector: (row) => row.type, sortable: true },
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
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      <DataTable columns={columns} data={transactions} pagination highlightOnHover />
    </div>
  );
}
