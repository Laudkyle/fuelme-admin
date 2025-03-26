import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api"; // Import API helper
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons

export default function RepaymentSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    loan_uuid: "",
    due_date: "",
    repayment_frequency: "",
    total_amount_due: "",
    status: "pending",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRepayments();
    fetchLoans();
  }, []);

  const fetchRepayments = async () => {
    try {
      const data = await api.get("/repaymentSchedules");
      setSchedules(data.data || []);
    } catch (error) {
      console.error("Error fetching repayments:", error);
    }
  };

  const fetchLoans = async () => {
    try {
      const data = await api.get("/loans");
      setLoans(data.data || []);
    } catch (error) {
      console.error("Error fetching loans:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.loan_uuid) newErrors.loan_uuid = "Loan is required";
    if (!formData.due_date) newErrors.due_date = "Due date is required";
    if (!formData.repayment_frequency) newErrors.repayment_frequency = "Frequency is required";
    if (!formData.total_amount_due || isNaN(formData.total_amount_due) || formData.total_amount_due <= 0)
      newErrors.total_amount_due = "Valid amount is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await api.post("/repaymentSchedules", formData);
      setIsModalOpen(false);
      fetchRepayments();
    } catch (error) {
      console.error("Error adding repayment schedule:", error);
    }
  };

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

      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Repayment
      </button>

      <DataTable columns={columns} data={schedules} pagination striped />

      {/* Modal for Adding Repayment Schedule */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add Repayment</h2>
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

              <label className="block mb-2">Due Date</label>
              <input
                type="date"
                className="w-full border p-2 rounded mb-2"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
              {errors.due_date && <p className="text-red-500 text-sm">{errors.due_date}</p>}

              <label className="block mb-2">Repayment Frequency</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.repayment_frequency}
                onChange={(e) => setFormData({ ...formData, repayment_frequency: e.target.value })}
              >
                <option value="">Select Frequency</option>
                <option value="weekly">Weekly</option>
                <option value="every_two_weeks">Every Two Weeks</option>
                <option value="monthly">Monthly</option>
                <option value="anytime">Anytime</option>
              </select>
              {errors.repayment_frequency && <p className="text-red-500 text-sm">{errors.repayment_frequency}</p>}

              <label className="block mb-2">Total Amount Due</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.total_amount_due}
                onChange={(e) => setFormData({ ...formData, total_amount_due: e.target.value })}
              />
              {errors.total_amount_due && <p className="text-red-500 text-sm">{errors.total_amount_due}</p>}

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
