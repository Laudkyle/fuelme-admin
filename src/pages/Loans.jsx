import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_uuid: "",
    amount: "",
    balance: "",
    agent_uuid: "",
    car_uuid: "",
    status: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      const data = await res.json();
      setLoans(data);
    } catch (err) {
      console.error("Error fetching loans:", err);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.user_uuid.trim()) newErrors.user_uuid = "User ID is required";
    if (!formData.amount.trim() || isNaN(formData.amount)) newErrors.amount = "Valid amount is required";
    if (!formData.balance.trim() || isNaN(formData.balance)) newErrors.balance = "Valid balance is required";
    if (!formData.agent_uuid.trim()) newErrors.agent_uuid = "Agent ID is required";
    if (!formData.car_uuid.trim()) newErrors.car_uuid = "Car ID is required";
    if (!formData.status.trim()) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchLoans(); // Refresh table
      } else {
        console.error("Failed to add loan");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

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

      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Loan
      </button>

      <DataTable columns={columns} data={loans} pagination striped />

      {/* Modal for Adding Loan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add Loan</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">User ID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.user_uuid}
                onChange={(e) => setFormData({ ...formData, user_uuid: e.target.value })}
              />
              {errors.user_uuid && <p className="text-red-500 text-sm">{errors.user_uuid}</p>}

              <label className="block mb-2">Amount</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}

              <label className="block mb-2">Balance</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
              />
              {errors.balance && <p className="text-red-500 text-sm">{errors.balance}</p>}

              <label className="block mb-2">Agent ID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.agent_uuid}
                onChange={(e) => setFormData({ ...formData, agent_uuid: e.target.value })}
              />
              {errors.agent_uuid && <p className="text-red-500 text-sm">{errors.agent_uuid}</p>}

              <label className="block mb-2">Car ID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.car_uuid}
                onChange={(e) => setFormData({ ...formData, car_uuid: e.target.value })}
              />
              {errors.car_uuid && <p className="text-red-500 text-sm">{errors.car_uuid}</p>}

              <label className="block mb-2">Status</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}

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
};

export default Loans;
