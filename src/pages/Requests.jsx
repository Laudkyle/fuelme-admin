import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import { Pencil, Trash2 } from "lucide-react"; // Lucide icons
import api from "../api"; // API helper

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [cars, setCars] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [formData, setFormData] = useState({
    phone_number: "",
    user_uuid: "",
    fuel: "",
    fuel_type: "",
    amount: "",
    station_uuid: "",
    car_uuid: "",
    agent_uuid: "",
    status: "Pending",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchStations();
    fetchCars();
    fetchAgents();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/requests");
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    }
  };

  const fetchStations = async () => {
    try {
      const { data } = await api.get("/stations");
      setStations(data || []);
    } catch (error) {
      console.error("Error fetching stations:", error);
      setStations([]);
    }
  };

  const fetchCars = async () => {
    try {
      const { data } = await api.get("/cars");
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching cars:", error);
      setCars([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await api.get("/agents");
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    
    // Validate that either amount or fuel is provided
    const isAmountValid = formData.amount && !isNaN(formData.amount) && formData.amount > 0;
    const isFuelValid = formData.fuel && !isNaN(formData.fuel) && formData.fuel > 0;
    
    if (!isAmountValid && !isFuelValid) {
      newErrors.amount = "Either amount or fuel in litres is required";
      newErrors.fuel = "Either amount or fuel in litres is required";
    }

    if (!formData.station_uuid.trim()) newErrors.station_uuid = "Station is required";
    if (!formData.car_uuid.trim()) newErrors.car_uuid = "Car is required";
    if (!formData.agent_uuid.trim()) newErrors.agent_uuid = "Agent is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = await api.get(`/users/${formData.phone_number}`);
      if (!userData || !userData.data.user_uuid) {
        setErrors({ phone_number: "User not found with this phone number" });
        setIsLoading(false);
        return;
      }

      const requestData = { ...formData, user_uuid: userData.data.user_uuid };
      delete requestData.phone_number; // Remove phone_number before submitting
      console.log(requestData)

      if (isEdit) {
        await api.put(`/requests/${currentRequest.request_uuid}`, requestData);
      } else {
        await api.post("/requests", requestData);
      }

      setIsModalOpen(false);
      fetchRequests();
    } catch (error) {
      console.error("Error saving request:", error);
    } finally {
      setIsLoading(false);
      setIsEdit(false);
      setCurrentRequest(null);
    }
  };

  const handleEdit = (request) => {
    setIsEdit(true);
    setCurrentRequest(request);
    setFormData({
      phone_number: "",
      ...request,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (request_uuid) => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;

    try {
      await api.delete(`/requests/${request_uuid}`);
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const columns = [
    { name: "Fuel Type", selector: (row) => row.fuel_type, sortable: true },
    { name: "Fuel(L)", selector: (row) => row.fuel, sortable: true },
    { name: "Amount Paid", selector: (row) => row.amount, sortable: true },
    { name: "Station UUID", selector: (row) => row.station_uuid, sortable: true },
    { name: "Car UUID", selector: (row) => row.car_uuid, sortable: true },
    { name: "Agent UUID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    { name: "Date", selector: (row) => new Date(row.datetime).toLocaleDateString(), sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-3">
          <button onClick={() => handleEdit(row)} className="text-blue-500">
            <Pencil size={20} />
          </button>
          <button onClick={() => handleDelete(row.request_uuid)} className="text-red-500">
            <Trash2 size={20} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Requests</h1>

      <button
        onClick={() => {
          setIsEdit(false);
          setFormData({
            phone_number: "",
            user_uuid: "",
            fuel: "",
            amount: "",
            station_uuid: "",
            car_uuid: "",
            agent_uuid: "",
            status: "Pending",
          });
          setIsModalOpen(true);
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Request
      </button>

      <div className="overflow-x-auto" style={{ width: "calc(100vw - 350px)" }}>
        <DataTable columns={columns} data={requests} pagination highlightOnHover />
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-[800px]">
            <h2 className="text-lg font-bold mb-4">{isEdit ? "Edit Request" : "Add Request"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-6">
                {/* First Column */}
                <div>
                  <div className="mb-4">
                    <label className="block mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      className={`w-full border p-2 rounded ${errors.phone_number ? 'border-red-500' : ''}`}
                      value={formData.phone_number} 
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                    {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Fuel Type</label>
                    <select 
                      className={`w-full border p-2 rounded ${errors.fuel_type ? 'border-red-500' : ''}`} 
                      value={formData.fuel_type} 
                      onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                    {errors.fuel && <p className="text-red-500 text-sm mt-1">{errors.fuel}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Amount</label>
                    <input 
                      type="number" 
                      className={`w-full border p-2 rounded ${errors.amount ? 'border-red-500' : ''}`}
                      value={formData.amount} 
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2">Fuel in litres</label>
                    <input 
                      type="number" 
                      className={`w-full border p-2 rounded ${errors.fuel ? 'border-red-500' : ''}`}
                      value={formData.fuel} 
                      onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                    />
                    {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                  </div>
                </div>

                {/* Second Column */}
                <div>
                  <div className="mb-4">
                    <label className="block mb-2">Station</label>
                    <select 
                      className={`w-full border p-2 rounded ${errors.station_uuid ? 'border-red-500' : ''}`}
                      value={formData.station_uuid} 
                      onChange={(e) => setFormData({ ...formData, station_uuid: e.target.value })}
                    >
                      <option value="">Select Station</option>
                      {stations.map((station) => (
                        <option key={station.station_uuid} value={station.station_uuid}>
                          {station.location}
                        </option>
                      ))}
                    </select>
                    {errors.station_uuid && <p className="text-red-500 text-sm mt-1">{errors.station_uuid}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Car</label>
                    <select 
                      className={`w-full border p-2 rounded ${errors.car_uuid ? 'border-red-500' : ''}`}
                      value={formData.car_uuid} 
                      onChange={(e) => setFormData({ ...formData, car_uuid: e.target.value })}
                    >
                      <option value="">Select Car</option>
                      {cars.map((car) => (
                        <option key={car.car_uuid} value={car.car_uuid}>
                          {car.car_model}
                        </option>
                      ))}
                    </select>
                    {errors.car_uuid && <p className="text-red-500 text-sm mt-1">{errors.car_uuid}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Agent</label>
                    <select 
                      className={`w-full border p-2 rounded ${errors.agent_uuid ? 'border-red-500' : ''}`}
                      value={formData.agent_uuid} 
                      onChange={(e) => setFormData({ ...formData, agent_uuid: e.target.value })}
                    >
                      <option value="">Select Agent</option>
                      {agents.map((agent) => (
                        <option key={agent.agent_uuid} value={agent.agent_uuid}>
                          {agent.fullname}
                        </option>
                      ))}
                    </select>
                    {errors.agent_uuid && <p className="text-red-500 text-sm mt-1">{errors.agent_uuid}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2">Status</label>
                    <select 
                      className="w-full border p-2 rounded"
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button 
                  type="submit" 
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : (isEdit ? "Update Request" : "Add Request")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}