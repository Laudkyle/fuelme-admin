import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCar, setCurrentCar] = useState(null);
  const [formData, setFormData] = useState({
    phone_number: "",
    car_model: "",
    car_number: "",
    fuel_type: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const res = await fetch("/api/cars");
      const data = await res.json();
      setCars(data);
    } catch (error) {
      console.error("Error fetching cars:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!formData.car_model.trim()) newErrors.car_model = "Car model is required";
    if (!formData.car_number.trim()) newErrors.car_number = "Car number is required";
    if (!formData.fuel_type.trim()) newErrors.fuel_type = "Fuel type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Fetch user_uuid based on phone number
      const userRes = await fetch(`/api/users/phone/${formData.phone_number}`);
      if (!userRes.ok) {
        setErrors({ phone_number: "User not found with this phone number" });
        setIsLoading(false);
        return;
      }

      const userData = await userRes.json();
      const user_uuid = userData.user_uuid;

      const url = isEditing ? `/api/cars/${currentCar.car_uuid}` : "/api/cars";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_uuid }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCars(); // Refresh table
      } else {
        console.error("Failed to save car");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
      setCurrentCar(null);
    }
  };

  const handleEdit = (car) => {
    setCurrentCar(car);
    setFormData({
      phone_number: "",
      car_model: car.car_model,
      car_number: car.car_number,
      fuel_type: car.fuel_type,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (car_uuid) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this car?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/cars/${car_uuid}`, { method: "DELETE" });
      if (res.ok) {
        fetchCars(); // Refresh table after deletion
      } else {
        console.error("Failed to delete car");
      }
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  const columns = [
    { name: "Car UUID", selector: (row) => row.car_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Model", selector: (row) => row.car_model, sortable: true },
    { name: "Number", selector: (row) => row.car_number, sortable: true },
    { name: "Fuel Type", selector: (row) => row.fuel_type, sortable: true },
    { name: "Created On", selector: (row) => new Date(row.date_created).toLocaleDateString(), sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <button onClick={() => handleEdit(row)} className="text-blue-500 mr-2">            <Pencil size={18} />
          </button>
          <button onClick={() => handleDelete(row.car_uuid)} className="text-red-500">            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cars</h1>

      <button onClick={() => { setIsModalOpen(true); setIsEditing(false); setFormData({ phone_number: "", car_model: "", car_number: "", fuel_type: "" }); }} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
        + Add Car
      </button>

      <DataTable columns={columns} data={cars} pagination highlightOnHover />

      {/* Modal for Adding/Editing Car */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit Car" : "Add Car"}</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">Phone Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                disabled={isEditing} // Don't change phone number while editing
              />
              {errors.phone_number && <p className="text-red-500 text-sm">{errors.phone_number}</p>}

              <label className="block mb-2">Car Model</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.car_model}
                onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
              />
              {errors.car_model && <p className="text-red-500 text-sm">{errors.car_model}</p>}

              <label className="block mb-2">Car Number</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.car_number}
                onChange={(e) => setFormData({ ...formData, car_number: e.target.value })}
              />
              {errors.car_number && <p className="text-red-500 text-sm">{errors.car_number}</p>}

              <label className="block mb-2">Fuel Type</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.fuel_type}
                onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              />
              {errors.fuel_type && <p className="text-red-500 text-sm">{errors.fuel_type}</p>}

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" disabled={isLoading}>
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
