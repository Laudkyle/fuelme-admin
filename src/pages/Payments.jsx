import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Pencil, Trash2 } from "lucide-react";
import api from "../api"; // Import API helper

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    loan_uuid: "",
    amount: "",
    datetime: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPayments();
    fetchLoans();
  }, []);

  const fetchPayments = async () => {
    try {
      const data = await api.get("/payments");
      setPayments(data.data ?? []); // Fallback to empty array if null
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]); // Prevent errors by setting an empty array
    }
  };

  const fetchLoans = async () => {
    try {
      const data = await api.get("/loans");
      setLoans(data.data ?? []); // Fallback to empty array if null
    } catch (error) {
      console.error("Error fetching loans:", error);
      setLoans([]); // Prevent errors
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.loan_uuid) newErrors.loan_uuid = "Loan is required";
    if (!formData.amount || isNaN(formData.amount) || formData.amount <= 0)
      newErrors.amount = "Valid amount is required";
    if (!formData.datetime) newErrors.datetime = "Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await api.post("/payments", formData);
      setIsModalOpen(false);
      fetchPayments();
    } catch (error) {
      console.error("Error saving payment:", error);
    }
  };

  const columns = [
    { name: "Loan UUID", selector: (row) => row.loan_uuid ?? "N/A", sortable: true },
    { 
      name: "Amount", 
      selector: (row) => row.amount ? `$${row.amount.toFixed(2)}` : "N/A", 
      sortable: true 
    },
    { 
      name: "Date", 
      selector: (row) => row.datetime ? new Date(row.datetime).toLocaleDateString() : "N/A", 
      sortable: true 
    },
    {
      name: "Actions",
      cell: () => (
        <div className="flex space-x-2 text-gray-400 cursor-not-allowed">
          <Pencil size={18} />
          <Trash2 size={18} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Payments</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setFormData({ loan_uuid: "", amount: "", datetime: "" });
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Payment
      </button>

      <DataTable columns={columns} data={payments} pagination highlightOnHover />

      {/* Modal for Adding Payment */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add Payment</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">Loan</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.loan_uuid}
                onChange={(e) => setFormData({ ...formData, loan_uuid: e.target.value })}
              >
                <option value="">Select Loan</option>
                {loans.map((loan) => (
                  <option key={loan.loan_uuid} value={loan.loan_uuid}>
                    {loan.loan_uuid}
                  </option>
                ))}
              </select>
              {errors.loan_uuid && <p className="text-red-500 text-sm">{errors.loan_uuid}</p>}

              <label className="block mb-2">Amount</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}

              <label className="block mb-2">Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded mb-2"
                value={formData.datetime}
                onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
              />
              {errors.datetime && <p className="text-red-500 text-sm">{errors.datetime}</p>}

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
