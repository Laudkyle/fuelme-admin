import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api"; // Import API instance
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons

export default function Banks() {
  const [banks, setBanks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBank, setCurrentBank] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    bank_name: "",
    account_number: "",
    location: "",
  });

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

    setIsLoading(true);

    try {
      if (isEditing) {
        await api.put(`/banks/${currentBank.bank_uuid}`, formData);
      } else {
        await api.post("/banks", formData);
      }

      setIsModalOpen(false);
      fetchBanks();
    } catch (error) {
      console.error("Failed to save bank:", error);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
      setCurrentBank(null);
    }
  };

  const handleEdit = (bank) => {
    setCurrentBank(bank);
    setFormData({
      bank_name: bank.bank_name || "",
      account_number: bank.account_number || "",
      location: bank.location || "",
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (bank_uuid) => {
    if (!window.confirm("Are you sure you want to delete this bank?")) return;

    try {
      await api.delete(`/banks/${bank_uuid}`);
      fetchBanks();
    } catch (error) {
      console.error("Error deleting bank:", error);
    }
  };

  const columns = [
    { name: "Bank UUID", selector: (row) => row.bank_uuid, sortable: true },
    { name: "Bank Name", selector: (row) => row.bank_name, sortable: true },
    { name: "Account Number", selector: (row) => row.account_number, sortable: true },
    { name: "Location", selector: (row) => row.location, sortable: true },
    { name: "Created On", selector: (row) => new Date(row.date_created).toLocaleDateString(), sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <button onClick={() => handleEdit(row)} className="text-blue-500 hover:text-blue-700">
            <Pencil size={18} />
          </button>
          <button onClick={() => handleDelete(row.bank_uuid)} className="text-red-500 hover:text-red-700">
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Banks</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setIsEditing(false);
          setFormData({ bank_name: "", account_number: "", location: "" });
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Bank
      </button>

      <DataTable columns={columns} data={banks} pagination highlightOnHover />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit Bank" : "Add Bank"}</h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Bank Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
              {errors.bank_name && <p className="text-red-500 text-sm">{errors.bank_name}</p>}

              <label className="block mb-2">Account Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              />
              {errors.account_number && <p className="text-red-500 text-sm">{errors.account_number}</p>}

              <label className="block mb-2">Location</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  {isLoading ? <Loader2 className="animate-spin" /> : isEditing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
