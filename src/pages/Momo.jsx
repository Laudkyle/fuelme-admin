import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Pencil, Trash2 } from "lucide-react"; // Import Lucide icons
import api from "../api"; // Import API helper

export default function Momo() {
  const [momo, setMomo] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMomo, setCurrentMomo] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    vendor: "",
    name: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMomo();
  }, []);

  const fetchMomo = async () => {
    try {
      const data = await api.get("/momo");
      setMomo(Array.isArray(data.data) ? data.data : []); // Ensure momo is always an array
    } catch (error) {
      console.error("Error fetching MOMO:", error);
      setMomo([]); // Fallback to an empty array
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.phone.trim() || formData.phone.length < 10)
      newErrors.phone = "Valid phone is required";
    if (!formData.vendor.trim()) newErrors.vendor = "Vendor is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let user_uuid = currentMomo?.user_uuid;

      if (!isEditing) {
        // Fetch user_uuid using phone number for new entry
        const userData = await api.get(`/users/${formData.phone}`);
        if (!userData || !userData.data.user_uuid) {
          setErrors({ phone: "User not found with this phone number" });
          setIsLoading(false);
          return;
        }
        user_uuid = userData.data.user_uuid;
      }

      const momoData = { ...formData, user_uuid };

      if (isEditing) {
        await api.put(`/momo/${currentMomo.momo_uuid}`, momoData);
      } else {
        await api.post("/momo", momoData);
      }

      setIsModalOpen(false);
      fetchMomo(); // Refresh table
    } catch (error) {
      console.error("Error saving MOMO:", error);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
      setCurrentMomo(null);
    }
  };

  const handleEdit = (momo) => {
    setCurrentMomo(momo);
    setFormData({
      phone: momo.phone, // Prevent modifying phone
      vendor: momo.vendor,
      name: momo.name,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (momo_uuid) => {
    if (!window.confirm("Are you sure you want to delete this MOMO?")) return;

    try {
      await api.delete(`/momo/${momo_uuid}`);
      fetchMomo();
    } catch (error) {
      console.error("Error deleting MOMO:", error);
    }
  };

  const columns = [
    { name: "Vendor", selector: (row) => row.vendor, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    {
      name: "Created On",
      selector: (row) => new Date(row.date_created).toLocaleDateString(),
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(row)} className="text-blue-500">
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.momo_uuid)}
            className="text-red-500"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">MOMO</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setIsEditing(false);
          setFormData({ phone: "", vendor: "", name: "" });
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add MOMO
      </button>

      <DataTable columns={columns} data={momo} pagination highlightOnHover />

      {/* Modal for Adding/Editing MOMO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">
              {isEditing ? "Edit MOMO" : "Add MOMO"}
            </h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Phone</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                disabled={isEditing} // Prevent modifying phone when editing
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}

              <label className="block mb-2">Vendor</label>
              <select
                className="w-full border p-2 rounded mb-2"
                value={formData.vendor}
                onChange={(e) =>
                  setFormData({ ...formData, vendor: e.target.value })
                }
              >
                <option value="">Select Vendor</option>
                <option value="MTN">MTN</option>
                <option value="Telecel">Telecel</option>
                <option value="AirtelTigo">AirtelTigo</option>
              </select>
              {errors.vendor && (
                <p className="text-red-500 text-sm">{errors.vendor}</p>
              )}

              <label className="block mb-2">Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
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
                  {isLoading ? "Saving..." : isEditing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
