import { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import api from "../api";
import { Pencil, Trash, Search, User } from "lucide-react";

export default function Agents() {
  const [data, setData] = useState([]);
  const [stations, setStations] = useState([]);
  const [users, setUsers] = useState([]); // Store users
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_uuid: "",
    fullname: "",
    phone: "",
    station_uuid: "",
    transaction_pin: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState(null);
  const [errors, setErrors] = useState({});
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchStations();
    fetchUsers(); // Fetch users on component mount
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
      const res = await api.get("/stations");
      setStations(res.data);
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

// Fetch all users for the dropdown with phone data
const fetchUsers = async () => {
  try {
    setLoadingUsers(true);
    
    // Fetch profiles and users in parallel
    const [profilesRes, usersRes] = await Promise.all([
      api.get("/profiles"),
      api.get("/users")
    ]);
    
    // Create a map of users by user_uuid for quick lookup
    const usersMap = {};
    usersRes.data.forEach(user => {
      usersMap[user.user_uuid] = user;
    });
    
    // Merge profiles with phone data from users
    const mergedUsers = profilesRes.data.map(profile => {
      const userData = usersMap[profile.user_uuid];
      return {
        ...profile,
        phone: userData ? userData.phone : null
      };
    });
    
    setUsers(mergedUsers);
    console.log("Merged users data: ", mergedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    setLoadingUsers(false);
  }
};

  // Filter users based on search input
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    
    const searchLower = userSearch.toLowerCase();
    return users.filter(user => {
      const fullName = `${user.name || ''} ${user.fullname || ''}`.toLowerCase();
      const phone = user.phone?.toLowerCase() || '';
      
      return fullName.includes(searchLower) || 
             phone.includes(searchLower) ||
             user.email?.toLowerCase().includes(searchLower);
    });
  }, [users, userSearch]);

  // Handle user selection
  const handleUserSelect = (user) => {
    setFormData({
      ...formData,
      user_uuid: user.user_uuid || user._id,
      fullname: user.fullname || user.name || "",
      phone: user.phone || "",
    });
    setUserSearch(`${user.fullname || user.name} (${user.phone})`);
    setShowUserDropdown(false);
  };

  // Validate form inputs
  const validateForm = () => {
    let newErrors = {};
    
    // Don't require user_uuid in edit mode since it's already set
    if (!editMode && !formData.user_uuid.trim()) {
      newErrors.user_uuid = "User selection is required";
    }
    
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
      // Prepare data for API
      const agentData = {
        ...formData,
        // Remove user search string from data
        fullname: formData.fullname.trim(),
        phone: formData.phone.trim(),
        station_uuid: formData.station_uuid.trim(),
        transaction_pin: formData.transaction_pin.trim()
      };

      if (editMode) {
        await api.put(`/agents/${currentAgentId}`, agentData);
      } else {
        // Only include user_uuid for new agents
        const createData = {
          ...agentData,
          user_uuid: formData.user_uuid.trim()
        };
        await api.post("/agents/create", createData); 
      }

      setIsModalOpen(false);
      fetchAgents();
      resetForm();
    } catch (error) {
      console.error("Error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to save agent");
    }
  };

  // Open modal for editing an agent
  const handleEdit = (agent) => {
    // Find the associated user if available
    const user = users.find(u => u._id === agent.user_uuid || u.user_uuid === agent.user_uuid);
    
    setFormData({
      user_uuid: agent.user_uuid || "",
      fullname: agent.fullname || "",
      phone: agent.phone || "",
      station_uuid: agent.station_uuid || "",
      transaction_pin: "", // Don't show existing PIN for security
    });
    
    if (user) {
      setUserSearch(`${user.fullname || user.name} (${user.phone})`);
    } else {
      setUserSearch("");
    }
    
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
      alert("Failed to delete agent");
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      user_uuid: "",
      fullname: "",
      phone: "",
      station_uuid: "",
      transaction_pin: "",
    });
    setUserSearch("");
    setErrors({});
    setEditMode(false);
    setCurrentAgentId(null);
    setShowUserDropdown(false);
  };

  // Table columns
  const columns = [
    { name: "Agent UUID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Full Name", selector: (row) => row.fullname, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    {
      name: "User UUID",
      selector: (row) => row.user_uuid || "N/A",
      sortable: true,
    },
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
      name: "Actions",
      cell: (row) => (
        <div className="flex">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-500 mr-2 hover:text-blue-700"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.agent_uuid)}
            className="text-red-500 hover:text-red-700"
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
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        + Add Agent
      </button>

      <DataTable 
        columns={columns} 
        data={data} 
        pagination 
        highlightOnHover
        progressPending={loadingUsers}
      />

      {/* Modal for Adding or Editing Agent */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {editMode ? "Edit Agent" : "Add Agent"}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* User Search Dropdown - Only for new agents */}
              {!editMode && (
                <>
                  <label className="block mb-2 font-medium">
                    Select User <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mb-2">
                    <div className="flex items-center border rounded">
                      <Search className="ml-2 text-gray-400" size={20} />
                      <input
                        type="text"
                        className="w-full p-2 focus:outline-none"
                        placeholder="Search user by name or phone..."
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setShowUserDropdown(true);
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                      />
                    </div>
                    
                    {showUserDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center">Loading users...</div>
                        ) : filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <div
                              key={user._id || user.user_uuid}
                              className="p-3 hover:bg-gray-100 cursor-pointer border-b"
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="flex items-center">
                                <User className="mr-2 text-gray-500" size={18} />
                                <div>
                                  <div className="font-medium">
                                    {user.fullname || user.name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {user.phone} • {user.email || "No email"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.user_uuid && (
                    <p className="text-red-500 text-sm mb-2">{errors.user_uuid}</p>
                  )}
                </>
              )}

              <label className="block mb-2 font-medium">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
                disabled={!editMode} // Auto-populated from user selection
              />
              {errors.fullname && (
                <p className="text-red-500 text-sm mb-2">{errors.fullname}</p>
              )}

              <label className="block mb-2 font-medium">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={!editMode} // Auto-populated from user selection
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mb-2">{errors.phone}</p>
              )}

              <label className="block mb-2 font-medium">
                Station <span className="text-red-500">*</span>
              </label>
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
                <p className="text-red-500 text-sm mb-2">{errors.station_uuid}</p>
              )}

              <label className="block mb-2 font-medium">
                Transaction PIN <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="w-full border p-2 rounded mb-2"
                value={formData.transaction_pin}
                onChange={(e) =>
                  setFormData({ ...formData, transaction_pin: e.target.value })
                }
                placeholder={editMode ? "Enter new PIN (leave blank to keep current)" : ""}
              />
              {errors.transaction_pin && (
                <p className="text-red-500 text-sm mb-2">{errors.transaction_pin}</p>
              )}

              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  {editMode ? "Update" : "Add Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}