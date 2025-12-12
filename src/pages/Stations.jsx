import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api";
import { Pencil, Trash, Loader2 } from "lucide-react"; // Lucide icons

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);
  const [loading, setloading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    longitude: "",
    latitude: "",
    ppl_petrol: "",
    ppl_diesel: "",
    code: "",
    bank_uuid: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStations();
    fetchBanks();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await api.get("/stations");
      setStations(res.data);
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/banks");
      setBanks(res.data);
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Station name is required";
    if (!formData.ppl_diesel.trim())
      newErrors.ppl_diesel = "Price Per Litre of diesel is required";
    if (!formData.ppl_petrol.trim())
      newErrors.ppl_petrol = "Price Per Litre of petrol is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.code.trim()) newErrors.code = "Code is required";
    if (!formData.bank_uuid.trim()) newErrors.bank_uuid = "Bank is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setloading(true);
    const url = isEdit
      ? `/stations/${currentStation.station_uuid}`
      : "/stations";
    const method = isEdit ? "put" : "post";

    try {
      await api[method](url, formData);
      setIsModalOpen(false);
      setIsEdit(false);
      fetchStations();
    } catch (error) {
      console.error("Failed to save station", error);
    } finally {
      setloading(false);
      setFormData({
        name: "",
        location: "",
        longitude: "",
        latitude: "",
        ppl_petrol: "",
        ppl_diesel: "",
        code: "",
        bank_uuid: "",
      });
    }
  };

  const handleEdit = (station) => {
    setIsEdit(true);
    setCurrentStation(station);
    setFormData({ ...station });
    setIsModalOpen(true);
  };

  const handleDelete = async (station_uuid) => {
    if (!window.confirm("Are you sure you want to delete this station?"))
      return;

    try {
      await api.delete(`/stations/${station_uuid}`);
      fetchStations();
    } catch (error) {
      console.error("Failed to delete station", error);
    }
  };

  const columns = [
    { name: "Station Name", selector: (row) => row.name, sortable: true },
    { name: "Location", selector: (row) => row.location, sortable: true },
    { name: "Longitude", selector: (row) => row.longitude, sortable: true },
    { name: "Latitude", selector: (row) => row.latitude, sortable: true },
    { name: "PPL Petrol", selector: (row) => row.ppl_petrol, sortable: true },
    { name: "PPL Diesel", selector: (row) => row.ppl_diesel, sortable: true },
    { name: "Code", selector: (row) => row.code, sortable: true },
    {
      name: "Bank",
      selector: (row) =>
        banks.find((b) => b.bank_uuid === row.bank_uuid)?.bank_name || "N/A",
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
            <Pencil size={18} />
          </button>
          <button
            onClick={() => handleDelete(row.station_uuid)}
            className="text-red-500"
          >
            <Trash size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Stations</h1>
      <button
        onClick={() => {
          setIsEdit(false);
          setFormData({
            name: "",
            location: "",
            longitude: "",
            latitude: "",
            ppl_petrol: "",
            ppl_diesel: "",
            code: "",
            bank_uuid: "",
          });
          setIsModalOpen(true);
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Station
      </button>
      <DataTable
        columns={columns}
        data={stations}
        pagination
        highlightOnHover
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">
              {isEdit ? "Edit Station" : "Add Station"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="space-y-4">
                  {/* Station Name */}
                  <div>
                    <label className="block mb-1 font-medium">
                      Station Name *
                    </label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter station name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block mb-1 font-medium">Location *</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      placeholder="Enter location"
                    />
                    {errors.location && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Code */}
                  <div>
                    <label className="block mb-1 font-medium">Code *</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="Enter station code"
                    />
                    {errors.code && (
                      <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                    )}
                  </div>

                  {/* Bank */}
                  <div>
                    <label className="block mb-1 font-medium">Bank *</label>
                    <select
                      className="w-full border p-2 rounded"
                      value={formData.bank_uuid}
                      onChange={(e) =>
                        setFormData({ ...formData, bank_uuid: e.target.value })
                      }
                    >
                      <option value="">Select a bank</option>
                      {banks.map((bank) => (
                        <option key={bank.bank_uuid} value={bank.bank_uuid}>
                          {bank.bank_name}
                        </option>
                      ))}
                    </select>
                    {errors.bank_uuid && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.bank_uuid}
                      </p>
                    )}
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-4">
                  {/* Coordinates Section */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-medium">
                        Longitude
                      </label>
                      <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={formData.longitude}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            longitude: e.target.value,
                          })
                        }
                        placeholder="0.000000"
                      />
                      {errors.longitude && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.longitude}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 font-medium">Latitude</label>
                      <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={formData.latitude}
                        onChange={(e) =>
                          setFormData({ ...formData, latitude: e.target.value })
                        }
                        placeholder="0.000000"
                      />
                      {errors.latitude && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.latitude}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fuel Prices Section */}
                  <div>
                    <h3 className="font-medium mb-2 text-gray-700">
                      Fuel Prices (GHS)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-sm">
                          Diesel Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">
                            GHS
                          </span>
                          <input
                            type="text"
                            className="w-full border p-2 rounded pl-12"
                            value={formData.ppl_diesel}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ppl_diesel: e.target.value,
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        {errors.ppl_diesel && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.ppl_diesel}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 text-sm">
                          Petrol Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">
                            GHS
                          </span>
                          <input
                            type="text"
                            className="w-full border p-2 rounded pl-12"
                            value={formData.ppl_petrol}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                ppl_petrol: e.target.value,
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        {errors.ppl_petrol && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.ppl_petrol}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter prices per litre in Ghana Cedis
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {isEdit ? "Update Station" : "Add Station"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
