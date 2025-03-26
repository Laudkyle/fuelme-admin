import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api"; // Import API helper
import axios from "axios";
export default function Cars() {
  const [cars, setCars] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCar, setCurrentCar] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: "",
    car_model: "",
    car_number: "",
    fuel_type: "Petrol",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const data = await api.get("/cars");
      setCars(data.data || []); // Ensure cars is always an array
    } catch (error) {
      console.error("Error fetching cars:", error);
      setCars([]); // Fallback to empty array if error occurs
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.phone_number.trim())
      newErrors.phone_number = "Phone number is required";
    if (!formData.car_model.trim())
      newErrors.car_model = "Car model is required";
    if (!formData.car_number.trim())
      newErrors.car_number = "Car number is required";
    if (!formData.fuel_type.trim())
      newErrors.fuel_type = "Fuel type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Fetch user_uuid based on phone number
      const userData = await api.get(`/users/${formData.phone_number}`);
      if (!userData || !userData.data.user_uuid) {
        setErrors({ phone_number: "User not found with this phone number" });
        setIsLoading(false);
        return;
      }

      const user_uuid = userData.data.user_uuid;
      const carData = { ...formData, user_uuid };

      if (isEditing) {
        await api.put(`/cars/${currentCar?.car_uuid}`, carData);
      } else {
        await api.post("/cars/create", carData);
      }

      setIsModalOpen(false);
      fetchCars(); // Refresh table
    } catch (error) {
      console.error("Error saving car:", error);
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
      car_model: car.car_model || "",
      car_number: car.car_number || "",
      fuel_type: car.fuel_type || "Petrol",
      picture: car.picture,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };
  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleImageUpload({ target: { files: [file] } });
  };

  const handleImageUpload = async (event) => {
    setImageUploading(true);
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ picture: "Only .jpg, .jpeg, and .png files are allowed" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ picture: "File size should not exceed 5MB" });
      return;
    }

    const imageData = new FormData();
    imageData.append("file", file);
    imageData.append("upload_preset", "fuelme"); // Your Cloudinary preset

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dinb6qtto/image/upload",
        imageData
      );
      setFormData((prev) => ({ ...prev, picture: response.data.secure_url }));

      console.log(response.data.secure_url);
      setErrors({ picture: "" });
    } catch (error) {
      console.error("Image Upload Error:", error);
      setErrors({ picture: "Failed to upload image. Try again." });
    } finally {
      setImageUploading(false);
    }
  };

  const handleDelete = async (car_uuid) => {
    if (!window.confirm("Are you sure you want to delete this car?")) return;

    try {
      await api.delete(`/cars/${car_uuid}`);
      fetchCars();
    } catch (error) {
      console.error("Error deleting car:", error);
    }
  };

  const columns = [
    {
      name: "Car UUID",
      selector: (row) => row.car_uuid || "N/A",
      sortable: true,
    },
    {
      name: "User UUID",
      selector: (row) => row.user_uuid || "N/A",
      sortable: true,
    },
    {
      name: "Model",
      selector: (row) => row.car_model || "N/A",
      sortable: true,
    },
    {
      name: "Number",
      selector: (row) => row.car_number || "N/A",
      sortable: true,
    },
    {
      name: "Fuel Type",
      selector: (row) => row.fuel_type || "N/A",
      sortable: true,
    },
    {
      name: "Created On",
      selector: (row) =>
        row.date_created
          ? new Date(row.date_created).toLocaleDateString()
          : "N/A",
      sortable: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-500 mr-2"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row.car_uuid)}
            className="text-red-500"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cars</h1>

      <button
        onClick={() => {
          setIsModalOpen(true);
          setIsEditing(false);
          setFormData({
            phone_number: "",
            car_model: "",
            car_number: "",
            fuel_type: "Petrol",
          });
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Car
      </button>

      <DataTable columns={columns} data={cars} pagination highlightOnHover />

      {/* Modal for Adding/Editing Car */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-[600px]">
            <h2 className="text-lg font-bold mb-4">
              {isEditing ? "Edit Car" : "Add Car"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                {/* Phone Number */}
                <div>
                  <label className="block mb-1">Phone Number</label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    disabled={isEditing} // Don't change phone number while editing
                  />
                  {errors.phone_number && (
                    <p className="text-red-500 text-sm">
                      {errors.phone_number}
                    </p>
                  )}
                </div>

                {/* Car Model */}
                <div>
                  <label className="block mb-1">Car Model</label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.car_model}
                    onChange={(e) =>
                      setFormData({ ...formData, car_model: e.target.value })
                    }
                  />
                  {errors.car_model && (
                    <p className="text-red-500 text-sm">{errors.car_model}</p>
                  )}
                </div>

                {/* Car Number */}
                <div>
                  <label className="block mb-1">Car Number</label>
                  <input
                    type="text"
                    className="w-full border p-2 rounded"
                    value={formData.car_number}
                    onChange={(e) =>
                      setFormData({ ...formData, car_number: e.target.value })
                    }
                  />
                  {errors.car_number && (
                    <p className="text-red-500 text-sm">{errors.car_number}</p>
                  )}
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block mb-1">Fuel Type</label>
                  <select
                    className="w-full border p-2 rounded"
                    value={formData.fuel_type}
                    onChange={(e) =>
                      setFormData({ ...formData, fuel_type: e.target.value })
                    }
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                  {errors.fuel_type && (
                    <p className="text-red-500 text-sm">{errors.fuel_type}</p>
                  )}
                </div>

                {/* Car Image Upload */}
                <div className="col-span-2">
                  <label className="block mb-1">Car Image</label>
                  <div
                    className="border-dashed border-2 border-gray-300 p-4 rounded-lg flex flex-col items-center cursor-pointer relative"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() =>
                      document.getElementById("carImageInput").click()
                    }
                  >
                    {formData.picture ? (
                      <img
                        src={formData.picture}
                        alt="Car Preview"
                        className="w-full h-40 object-cover rounded"
                      />
                    ) : (
                      <p className="text-gray-500">
                        Drag & drop or click to select
                      </p>
                    )}

                    {imageUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <p className="text-white">Uploading...</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="carImageInput"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {errors.picture && (
                    <p className="text-red-500 text-sm">{errors.picture}</p>
                  )}
                </div>
              </div>

              {/* Buttons */}
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
