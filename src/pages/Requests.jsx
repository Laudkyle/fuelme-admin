import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [formData, setFormData] = useState({
    user_uuid: "",
    fuel: "",
    amount: "",
    station_uuid: "",
    car_uuid: "",
    agent_uuid: "",
    status: "Pending",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.user_uuid.trim()) newErrors.user_uuid = "User UUID is required";
    if (!formData.fuel || isNaN(formData.fuel) || formData.fuel <= 0) newErrors.fuel = "Valid fuel amount is required";
    if (!formData.amount || isNaN(formData.amount) || formData.amount <= 0) newErrors.amount = "Valid amount is required";
    if (!formData.station_uuid.trim()) newErrors.station_uuid = "Station UUID is required";
    if (!formData.car_uuid.trim()) newErrors.car_uuid = "Car UUID is required";
    if (!formData.agent_uuid.trim()) newErrors.agent_uuid = "Agent UUID is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const url = isEdit ? `/api/requests/${currentRequest.request_uuid}` : "/api/requests";
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
        fetchRequests(); // Refresh table
      } else {
        console.error("Failed to save request");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (request) => {
    setIsEdit(true);
    setCurrentRequest(request);
    setFormData({ ...request });
    setIsModalOpen(true);
  };

  const handleDelete = async (request_uuid) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;

    try {
      const res = await fetch(`/api/requests/${request_uuid}`, { method: "DELETE" });

      if (res.ok) {
        fetchRequests();
      } else {
        console.error("Failed to delete request");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const columns = [
    { name: "Request UUID", selector: (row) => row.request_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Fuel Amount", selector: (row) => row.fuel, sortable: true },
    { name: "Amount Paid", selector: (row) => row.amount, sortable: true },
    { name: "Station UUID", selector: (row) => row.station_uuid, sortable: true },
    { name: "Car UUID", selector: (row) => row.car_uuid, sortable: true },
    { name: "Agent UUID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    { name: "Date", selector: (row) => new Date(row.datetime).toLocaleDateString(), sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <button onClick={() => handleEdit(row)} className="text-blue-500 mr-2">Edit</button>
          <button onClick={() => handleDelete(row.request_uuid)} className="text-red-500">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Requests</h1>

      <button
        onClick={() => { setIsEdit(false); setFormData({ user_uuid: "", fuel: "", amount: "", station_uuid: "", car_uuid: "", agent_uuid: "", status: "Pending" }); setIsModalOpen(true); }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Request
      </button>

      <DataTable columns={columns} data={requests} pagination highlightOnHover />

      {/* Modal for Adding/Editing Request */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">{isEdit ? "Edit Request" : "Add Request"}</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">User UUID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.user_uuid}
                onChange={(e) => setFormData({ ...formData, user_uuid: e.target.value })}
              />
              {errors.user_uuid && <p className="text-red-500 text-sm">{errors.user_uuid}</p>}

              <label className="block mb-2">Fuel Amount</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.fuel}
                onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
              />
              {errors.fuel && <p className="text-red-500 text-sm">{errors.fuel}</p>}

              <label className="block mb-2">Amount Paid</label>
              <input
                type="number"
                className="w-full border p-2 rounded mb-2"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}

              <label className="block mb-2">Station UUID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.station_uuid}
                onChange={(e) => setFormData({ ...formData, station_uuid: e.target.value })}
              />
              {errors.station_uuid && <p className="text-red-500 text-sm">{errors.station_uuid}</p>}

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
