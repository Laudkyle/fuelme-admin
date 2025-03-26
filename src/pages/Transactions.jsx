import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api";
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [formData, setFormData] = useState({
    phone_number: "",
    user_uuid: "",
    loan_uuid: "",
    amount: "",
    type: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchTransactions();
    fetchLoans();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await api.get("/transactions");
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const fetchLoans = async () => {
    try {
      const { data } = await api.get("/loans");
      setLoans(data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const fetchUserUUID = async (phone) => {
    try {
      const { data } = await api.get(`/users/${phone}`);
      if (data && data.user_uuid) {
        setFormData((prev) => ({ ...prev, user_uuid: data.user_uuid }));
      } else {
        setFormData((prev) => ({ ...prev, user_uuid: "" }));
      }
    } catch (error) {
      console.error("Error fetching user UUID:", error);
      setFormData((prev) => ({ ...prev, user_uuid: "" }));
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.phone_number.trim())
      newErrors.phone_number = "Phone number is required";
    if (!formData.loan_uuid.trim())
      newErrors.loan_uuid = "Loan UUID is required";
    if (!formData.amount.trim() || isNaN(formData.amount))
      newErrors.amount = "Valid amount is required";
    if (!formData.type.trim()) newErrors.type = "Transaction type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    fetchUserUUID(formData.phone_number);
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEdit) {
        await api.put(
          `/transactions/${currentTransaction.transaction_uuid}`,
          formData
        );
      } else {
        await api.post("/transactions", formData);
      }

      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error saving transaction:", error);
    } finally {
      setIsEdit(false);
      setCurrentTransaction(null);
    }
  };

  const handleEdit = (transaction) => {
    setIsEdit(true);
    setCurrentTransaction(transaction);
    setFormData({ ...transaction, amount: transaction.amount.toString() });
    setIsModalOpen(true);
  };

  const handleDelete = async (transaction_uuid) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;

    try {
      await api.delete(`/transactions/${transaction_uuid}`);
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const columns = [
    {
      name: "Transaction UUID",
      selector: (row) => row.transaction_uuid,
      sortable: true,
    },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Loan UUID", selector: (row) => row.loan_uuid, sortable: true },
    {
      name: "Amount",
      selector: (row) => `$${parseFloat(row.amount).toFixed(2)}`,
      sortable: true,
    },
    { name: "Type", selector: (row) => row.type, sortable: true },
    {
      name: "Date",
      selector: (row) => new Date(row.datetime).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-500 mr-2"
          >
            
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.transaction_uuid)}
            className="text-red-500"
          >
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>

      <button
        onClick={() => {
          setIsEdit(false);
          setFormData({
            phone_number: "",
            user_uuid: "",
            loan_uuid: "",
            amount: "",
            type: "",
          });
          setIsModalOpen(true);
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Transaction
      </button>

      <div className="overflow-x-auto" style={{ width: "calc(100vw - 350px)" }}>
        <DataTable
          columns={columns}
          data={transactions}
          pagination
          highlightOnHover
        />
      </div>
      {/* Modal for Adding/Editing Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">
              {isEdit ? "Edit Transaction" : "Add Transaction"}
            </h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Phone Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone_number}
                onChange={(e) => {
                  setFormData({ ...formData, phone_number: e.target.value });
                }}
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm">{errors.phone_number}</p>
              )}

              <label className="block mb-2">Loan</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.loan_uuid}
                onChange={(e) =>
                  setFormData({ ...formData, loan_uuid: e.target.value })
                }
              >
                <option value="">Select Loan</option>
                {loans.map((loan) => (
                  <option key={loan.loan_uuid} value={loan.loan_uuid}>
                    {loan.loan_uuid}
                  </option>
                ))}
              </select>
              {errors.loan_uuid && (
                <p className="text-red-500 text-sm">{errors.loan_uuid}</p>
              )}

              <label className="block mb-2">Amount</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
              {errors.amount && (
                <p className="text-red-500 text-sm">{errors.amount}</p>
              )}

              <label className="block mb-2">Type</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="">Select Type</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
              </select>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
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
