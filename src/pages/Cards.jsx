import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons
import api from "../api";

export default function Cards() {
  const [cards, setCards] = useState([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false); // 🔹 Added loading state
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [formData, setFormData] = useState({
    phone_number: "",
    name: "",
    card_number: "",
    expiry_date: "",
    cvc: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {

    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await api.get("/cards");
      setCards(Array.isArray(response.data) ? response.data : []);
      console.log(response.data)
    } catch (error) {
      console.error("Error fetching cards:", error);
      setCards([]);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!/^\d{10,15}$/.test(formData.phone_number)) newErrors.phone_number = "Invalid phone number format";
    if (!formData.name.trim()) newErrors.name = "Card name is required";
    if (!/^\d{16}$/.test(formData.card_number)) newErrors.card_number = "Card number must be 16 digits";
    if (!/^\d{2}\/\d{2}$/.test(formData.expiry_date)) newErrors.expiry_date = "Format: MM/YY";
    if (!/^\d{3,4}$/.test(formData.cvc)) newErrors.cvc = "CVC must be 3 or 4 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setLoading(true);
  
    try {
      const { phone_number, ...cardData } = formData; 
  
      if (isEditing) {
        await api.put(`/cards/${selectedCardId}`, cardData); // 🔹 Only send relevant fields
      } else {
        await api.post("/cards/create", formData);
      }
  
      setIsModalOpen(false);
      setIsEditing(false);
      setSelectedCardId(null);
      fetchCards();
    } catch (error) {
      console.error("Error saving card:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (card) => {
    setFormData({
      phone_number: card.phone_number || "",
      name: card.name || "",
      card_number: card.card_number || "",
      expiry_date: card.expiry_date || "",
      cvc: card.cvc || "",
    });
    setSelectedCardId(card.card_uuid);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      try {
        await api.delete(`/cards/${id}`);
        fetchCards();
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    }
  };

  const columns = [
    // { name: "Phone Number", selector: (row) => row.phone_number || "N/A", sortable: true },
    { name: "Name", selector: (row) => row.name || "N/A", sortable: true },
    { name: "Card Number", selector: (row) => row.card_number || "N/A", sortable: true },
    { name: "Expiry Date", selector: (row) => row.expiry_date || "N/A", sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(row)} className="text-blue-500">
            <Pencil size={18} />
          </button>
          <button onClick={() => handleDelete(row.card_uuid)} className="text-red-500">
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cards</h1>
      <button onClick={() => setIsModalOpen(true)} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        + {isEditing ? "Edit" : "Add"} Card
      </button>
      <DataTable columns={columns} data={cards} pagination highlightOnHover noDataComponent="No cards available" />

      {/* Modal for Adding/Editing Card */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit" : "Add"} Card</h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Phone Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
              {errors.phone_number && <p className="text-red-500 text-sm">{errors.phone_number}</p>}

              <label className="block mb-2">Card Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

              <label className="block mb-2">Card Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.card_number}
                onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
              />
              {errors.card_number && <p className="text-red-500 text-sm">{errors.card_number}</p>}

              <label className="block mb-2">Expiry Date (MM/YY)</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
              {errors.expiry_date && <p className="text-red-500 text-sm">{errors.expiry_date}</p>}

              <label className="block mb-2">CVC</label>
              <input
                type="password"
                className="w-full border p-2 rounded mb-2"
                value={formData.cvc}
                onChange={(e) => setFormData({ ...formData, cvc: e.target.value })}
              />
              {errors.cvc && <p className="text-red-500 text-sm">{errors.cvc}</p>}

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                  {isEditing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
