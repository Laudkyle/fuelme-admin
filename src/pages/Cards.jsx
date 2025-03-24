import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_uuid: "",
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
      const res = await fetch("/api/cards");
      const data = await res.json();
      setCards(data);
    } catch (error) {
      console.error("Error fetching cards:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.user_uuid.trim()) newErrors.user_uuid = "User UUID is required";
    if (!formData.name.trim()) newErrors.name = "Card name is required";
    if (!formData.card_number.trim()) newErrors.card_number = "Card number is required";
    if (!/^\d{16}$/.test(formData.card_number)) newErrors.card_number = "Card number must be 16 digits";
    if (!formData.expiry_date.trim()) newErrors.expiry_date = "Expiry date is required";
    if (!/^\d{2}\/\d{2}$/.test(formData.expiry_date)) newErrors.expiry_date = "Format: MM/YY";
    if (!formData.cvc.trim()) newErrors.cvc = "CVC is required";
    if (!/^\d{3,4}$/.test(formData.cvc)) newErrors.cvc = "CVC must be 3 or 4 digits";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCards(); // Refresh table
      } else {
        console.error("Failed to add card");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const columns = [
    { name: "Card UUID", selector: (row) => row.card_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Card Number", selector: (row) => row.card_number, sortable: true },
    { name: "Expiry Date", selector: (row) => row.expiry_date, sortable: true },
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cards</h1>
      
      <button onClick={() => setIsModalOpen(true)} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        + Add Card
      </button>

      <DataTable columns={columns} data={cards} pagination highlightOnHover />

      {/* Modal for Adding Card */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">Add Card</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">User UUID</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.user_uuid}
                onChange={(e) => setFormData({ ...formData, user_uuid: e.target.value })}
              />
              {errors.user_uuid && <p className="text-red-500 text-sm">{errors.user_uuid}</p>}

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
