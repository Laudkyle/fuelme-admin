import React, { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api"; // Ensure you have API helper
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [agents, setAgents] = useState([]);
  const [cars, setCars] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: "",
    amount: "",
    balance: "",
    agent_uuid: "",
    car_uuid: "",
    status: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchLoans();
    fetchAgents();
    fetchCars();
  }, []);

  const fetchLoans = async () => {
    try {
      const data = await api.get("/loans");
      setLoans(data.data);
    } catch (err) {
      console.error("Error fetching loans:", err);
    }
  };

  const fetchAgents = async () => {
    try {
      const data = await api.get("/agents");
      setAgents(data.data);
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  const fetchCars = async () => {
    try {
      const data = await api.get("/cars");
      setCars(data.data);
    } catch (err) {
      console.error("Error fetching cars:", err);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.phone_number.trim())
      newErrors.phone_number = "Phone number is required";
    if (!formData.amount.trim() || isNaN(formData.amount))
      newErrors.amount = "Valid amount is required";
    if (!formData.balance.trim() || isNaN(formData.balance))
      newErrors.balance = "Valid balance is required";
    if (!formData.agent_uuid.trim()) newErrors.agent_uuid = "Agent is required";
    if (!formData.car_uuid.trim()) newErrors.car_uuid = "Car is required";
    if (!formData.status.trim()) newErrors.status = "Status is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const userData = await api.get(`/users/${formData.phone_number}`);
      if (!userData) {
        setErrors({ phone_number: "User not found with this phone number" });
        setIsLoading(false);
        return;
      }

      const user_uuid = userData.data.user_uuid;

      await api.post("/loans", { ...formData, user_uuid });

      setIsModalOpen(false);
      fetchLoans();
    } catch (error) {
      console.error("Error adding loan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { name: "User ID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Amount", selector: (row) => `$${row.amount}`, sortable: true },
    { name: "Balance", selector: (row) => `$${row.balance}`, sortable: true },
    {
      name: "Agent",
      selector: (row) => row.agent_name || row.agent_uuid,
      sortable: true,
    },
    {
      name: "Car",
      selector: (row) => row.car_model || row.car_uuid,
      sortable: true,
    },
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

      <div className="overflow-x-auto" style={{ width: "calc(100vw - 350px)" }}>
        <DataTable columns={columns} data={loans} pagination highlightOnHover />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add Loan</h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Phone Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
              />
              {errors.phone_number && (
                <p className="text-red-500 text-sm">{errors.phone_number}</p>
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

              <label className="block mb-2">Balance</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({ ...formData, balance: e.target.value })
                }
              />
              {errors.balance && (
                <p className="text-red-500 text-sm">{errors.balance}</p>
              )}

              <label className="block mb-2">Agent</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.agent_uuid}
                onChange={(e) =>
                  setFormData({ ...formData, agent_uuid: e.target.value })
                }
              >
                <option value="">Select Agent</option>
                {agents.map((agent) => (
                  <option key={agent.agent_uuid} value={agent.agent_uuid}>
                    {agent.fullname}
                  </option>
                ))}
              </select>
              {errors.agent_uuid && (
                <p className="text-red-500 text-sm">{errors.agent_uuid}</p>
              )}

              <label className="block mb-2">Car</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.car_uuid}
                onChange={(e) =>
                  setFormData({ ...formData, car_uuid: e.target.value })
                }
              >
                <option value="">Select Car</option>
                {cars.map((car) => (
                  <option key={car.car_uuid} value={car.car_uuid}>
                    {car.car_model}
                  </option>
                ))}
              </select>
              {errors.car_uuid && (
                <p className="text-red-500 text-sm">{errors.car_uuid}</p>
              )}

              <label className="block mb-2">Status</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm">{errors.status}</p>
              )}

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
                  disabled={isLoading}
                >
                  {isLoading ? "Adding..." : "Add"}
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
