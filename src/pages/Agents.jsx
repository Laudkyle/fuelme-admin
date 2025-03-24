import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Agents() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    station_uuid: "",
    transaction_pin: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAgentsAndUsers();
  }, []);

  const fetchAgentsAndUsers = async () => {
    try {
      const agentsRes = await fetch("/api/agents");
      const usersRes = await fetch("/api/users");

      const agents = await agentsRes.json();
      const users = await usersRes.json();

      const mergedData = agents.map((agent) => {
        const user = users.find((u) => u.user_uuid === agent.user_uuid) || {};
        return {
          agent_uuid: agent.agent_uuid,
          fullname: agent.fullname,
          phone: user.phone || "N/A",
          station_uuid: agent.station_uuid || "N/A",
          transaction_pin: agent.transaction_pin || "N/A",
          date_created: new Date(agent.date_created).toLocaleDateString(),
        };
      });

      setData(mergedData);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.fullname.trim()) newErrors.fullname = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!/^\d{10,15}$/.test(formData.phone)) newErrors.phone = "Invalid phone format";
    if (!formData.station_uuid.trim()) newErrors.station_uuid = "Station ID is required";
    if (!formData.transaction_pin.trim()) newErrors.transaction_pin = "Transaction PIN is required";
    if (!/^\d{4,6}$/.test(formData.transaction_pin)) newErrors.transaction_pin = "PIN must be 4-6 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchAgentsAndUsers(); // Refresh table
      } else {
        console.error("Failed to add agent");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const columns = [
    { name: "Agent UUID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Full Name", selector: (row) => row.fullname, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    { name: "Station", selector: (row) => row.station_uuid, sortable: true },
    { name: "Transaction PIN", selector: (row) => row.transaction_pin, sortable: true },
    { name: "Created On", selector: (row) => row.date_created, sortable: true },
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agents</h1>
      
      <button onClick={() => setIsModalOpen(true)} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        + Add Agent
      </button>

      <DataTable columns={columns} data={data} pagination highlightOnHover />

      {/* Modal for Adding Agent */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add Agent</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">Full Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              />
              {errors.fullname && <p className="text-red-500 text-sm">{errors.fullname}</p>}

              <label className="block mb-2">Phone</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

              <label className="block mb-2">Station UUID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.station_uuid}
                onChange={(e) => setFormData({ ...formData, station_uuid: e.target.value })}
              />
              {errors.station_uuid && <p className="text-red-500 text-sm">{errors.station_uuid}</p>}

              <label className="block mb-2">Transaction PIN</label>
              <input
                type="password"
                className="w-full border p-2 rounded mb-2"
                value={formData.transaction_pin}
                onChange={(e) => setFormData({ ...formData, transaction_pin: e.target.value })}
              />
              {errors.transaction_pin && <p className="text-red-500 text-sm">{errors.transaction_pin}</p>}

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
