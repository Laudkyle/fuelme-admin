import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api"; // Axios instance with authentication
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons

export default function Agents() {
  const [data, setData] = useState([]);
  const [stations, setStations] = useState([]); // Store stations
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    station_uuid: "",
    transaction_pin: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAgents();
    fetchStations();
  }, []);

  // Fetch all agents
  const fetchAgents = async () => {
    try {
      const res = await api.get("/agents");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  // Fetch all stations for the dropdown
  const fetchStations = async () => {
    try {
      const res = await api.get("/stations"); // Fetch station list
      setStations(res.data); // Save station data
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

  // Validate form inputs
  const validateForm = () => {
    let newErrors = {};
    if (!formData.fullname.trim()) newErrors.fullname = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!/^\d{10,15}$/.test(formData.phone))
      newErrors.phone = "Invalid phone format";
    if (!formData.station_uuid.trim())
      newErrors.station_uuid = "Station selection is required";
    if (!formData.transaction_pin.trim())
      newErrors.transaction_pin = "Transaction PIN is required";
    if (!/^\d{4,6}$/.test(formData.transaction_pin))
      newErrors.transaction_pin = "PIN must be 4-6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editMode) {
        await api.put(`/agents/${currentAgentId}`, formData);
      } else {
        await api.post("/agents/create", formData);
      }

      setIsModalOpen(false);
      fetchAgents();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Open modal for editing an agent
  const handleEdit = (agent) => {
    setFormData({
      fullname: agent.fullname,
      phone: agent.phone,
      station_uuid: agent.station_uuid,
      transaction_pin: agent.transaction_pin,
    });
    setCurrentAgentId(agent.agent_uuid);
    setEditMode(true);
    setIsModalOpen(true);
  };

  // Delete an agent
  const handleDelete = async (agent_uuid) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;
    try {
      await api.delete(`/agents/${agent_uuid}`);
      fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      fullname: "",
      phone: "",
      station_uuid: "",
      transaction_pin: "",
    });
    setErrors({});
    setEditMode(false);
    setCurrentAgentId(null);
  };

  // Table columns
  const columns = [
    { name: "Agent UUID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Full Name", selector: (row) => row.fullname, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    {
      name: "Station",
      selector: (row) => {
        const station = stations.find(
          (s) => s.station_uuid === row.station_uuid
        );
        return station ? station.location : "Unknown";
      },
      sortable: true,
    },
    {
      name: "Transaction PIN",
      selector: (row) => row.transaction_pin,
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-500 mr-2"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.agent_uuid)}
            className="text-red-500"
          >
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agents</h1>

      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Agent
      </button>

      <DataTable columns={columns} data={data} pagination highlightOnHover />

      {/* Modal for Adding or Editing Agent */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">
              {editMode ? "Edit Agent" : "Add Agent"}
            </h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Full Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
              />
              {errors.fullname && (
                <p className="text-red-500 text-sm">{errors.fullname}</p>
              )}

              <label className="block mb-2">Phone</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}

              <label className="block mb-2">Station</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.station_uuid}
                onChange={(e) =>
                  setFormData({ ...formData, station_uuid: e.target.value })
                }
              >
                <option value="">Select a station</option>
                {stations.map((station) => (
                  <option
                    key={station.station_uuid}
                    value={station.station_uuid}
                  >
                    {station.location}
                  </option>
                ))}
              </select>
              {errors.station_uuid && (
                <p className="text-red-500 text-sm">{errors.station_uuid}</p>
              )}

              <label className="block mb-2">Transaction PIN</label>
              <input
                type="password"
                className="w-full border p-2 rounded mb-2"
                value={formData.transaction_pin}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_pin: e.target.value })
                }
              />
              {errors.transaction_pin && (
                <p className="text-red-500 text-sm">{errors.transaction_pin}</p>
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
                >
                  {editMode ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
