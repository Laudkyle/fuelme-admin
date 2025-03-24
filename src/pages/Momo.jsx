import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Momo() {
  const [momo, setMomo] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_uuid: "",
    vendor: "",
    name: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMomo();
  }, []);

  const fetchMomo = async () => {
    try {
      const res = await fetch("/api/momo");
      const data = await res.json();
      setMomo(data);
    } catch (error) {
      console.error("Error fetching MOMO:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.user_uuid.trim()) newErrors.user_uuid = "User ID is required";
    if (!formData.vendor.trim()) newErrors.vendor = "Vendor is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.phone.trim() || formData.phone.length < 10) newErrors.phone = "Valid phone is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch("/api/momo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMomo(); // Refresh table
      } else {
        console.error("Failed to add MOMO");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const columns = [
    { name: "MOMO UUID", selector: (row) => row.momo_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Vendor", selector: (row) => row.vendor, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    { name: "Created On", selector: (row) => new Date(row.date_created).toLocaleDateString(), sortable: true },
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
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">MOMO</h1>

      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add MOMO
      </button>

      <DataTable columns={columns} data={momo} pagination highlightOnHover />

      {/* Modal for Adding MOMO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add MOMO</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">User ID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.user_uuid}
                onChange={(e) => setFormData({ ...formData, user_uuid: e.target.value })}
              />
              {errors.user_uuid && <p className="text-red-500 text-sm">{errors.user_uuid}</p>}

              <label className="block mb-2">Vendor</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
              {errors.vendor && <p className="text-red-500 text-sm">{errors.vendor}</p>}

              <label className="block mb-2">Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

              <label className="block mb-2">Phone</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

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
