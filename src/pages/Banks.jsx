import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api"; // Import API instance

export default function Banks() {
  const [banks, setBanks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    location: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const { data } = await api.get("/banks");
      setBanks(data);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.bank_name.trim()) newErrors.bank_name = "Bank name is required";
    if (!formData.account_number.trim()) newErrors.account_number = "Account number is required";
    if (!/^\d{8,20}$/.test(formData.account_number)) newErrors.account_number = "Invalid account number format";
    if (!formData.location.trim()) newErrors.location = "Location is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await api.post("/banks", formData);
      setIsModalOpen(false);
      fetchBanks();
    } catch (error) {
      console.error("Failed to add bank:", error);
    }
  };

  const columns = [
    { name: "Bank UUID", selector: (row) => row.bank_uuid, sortable: true },
    { name: "Bank Name", selector: (row) => row.bank_name, sortable: true },
    { name: "Account Number", selector: (row) => row.account_number, sortable: true },
    { name: "Location", selector: (row) => row.location, sortable: true },
    { name: "Created On", selector: (row) => new Date(row.date_created).toLocaleDateString(), sortable: true },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Banks</h1>

      <button onClick={() => setIsModalOpen(true)} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        + Add Bank
      </button>

      <DataTable columns={columns} data={banks} pagination highlightOnHover />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add Bank</h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Bank Name</label>
              <input type="text" className="w-full border p-2 rounded mb-2" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} />
              {errors.bank_name && <p className="text-red-500 text-sm">{errors.bank_name}</p>}

              <label className="block mb-2">Account Number</label>
              <input type="text" className="w-full border p-2 rounded mb-2" value={formData.account_number} onChange={(e) => setFormData({ ...formData, account_number: e.target.value })} />
              {errors.account_number && <p className="text-red-500 text-sm">{errors.account_number}</p>}

              <label className="block mb-2">Location</label>
              <input type="text" className="w-full border p-2 rounded mb-2" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}