import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [formData, setFormData] = useState({
    user_uuid: "",
    loan_uuid: "",
    amount: "",
    type: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.user_uuid.trim()) newErrors.user_uuid = "User UUID is required";
    if (!formData.loan_uuid.trim()) newErrors.loan_uuid = "Loan UUID is required";
    if (!formData.amount.trim() || isNaN(formData.amount)) newErrors.amount = "Valid amount is required";
    if (!formData.type.trim()) newErrors.type = "Transaction type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const url = isEdit ? `/api/transactions/${currentTransaction.transaction_uuid}` : "/api/transactions";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setIsEdit(false);
        fetchTransactions(); // Refresh table
      } else {
        console.error("Failed to save transaction");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (transaction) => {
    setIsEdit(true);
    setCurrentTransaction(transaction);
    setFormData({ ...transaction, amount: transaction.amount.toString() });
    setIsModalOpen(true);
  };

  const handleDelete = async (transaction_uuid) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetch(`/api/transactions/${transaction_uuid}`, { method: "DELETE" });

      if (res.ok) {
        fetchTransactions();
      } else {
        console.error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const columns = [
    { name: "Transaction UUID", selector: (row) => row.transaction_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Loan UUID", selector: (row) => row.loan_uuid, sortable: true },
    { name: "Amount", selector: (row) => `$${parseFloat(row.amount).toFixed(2)}`, sortable: true },
    { name: "Type", selector: (row) => row.type, sortable: true },
    { name: "Date", selector: (row) => new Date(row.datetime).toLocaleDateString(), sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <button onClick={() => handleEdit(row)} className="text-blue-500 mr-2">Edit</button>
          <button onClick={() => handleDelete(row.transaction_uuid)} className="text-red-500">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      <button
        onClick={() => { setIsEdit(false); setFormData({ user_uuid: "", loan_uuid: "", amount: "", type: "" }); setIsModalOpen(true); }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Transaction
      </button>

      <DataTable columns={columns} data={transactions} pagination highlightOnHover />

      {/* Modal for Adding/Editing Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">{isEdit ? "Edit Transaction" : "Add Transaction"}</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">User UUID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.user_uuid}
                onChange={(e) => setFormData({ ...formData, user_uuid: e.target.value })}
              />
              {errors.user_uuid && <p className="text-red-500 text-sm">{errors.user_uuid}</p>}

              <label className="block mb-2">Loan UUID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.loan_uuid}
                onChange={(e) => setFormData({ ...formData, loan_uuid: e.target.value })}
              />
              {errors.loan_uuid && <p className="text-red-500 text-sm">{errors.loan_uuid}</p>}

              <label className="block mb-2">Amount</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}

              <label className="block mb-2">Type</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>
              {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  {isEdit ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
