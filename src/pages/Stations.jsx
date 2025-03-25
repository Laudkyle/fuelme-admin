import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import api from "../api";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentStation, setCurrentStation] = useState(null);
  const [formData, setFormData] = useState({
    location: "",
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
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.code.trim()) newErrors.code = "Code is required";
    if (!formData.bank_uuid.trim()) newErrors.bank_uuid = "Bank is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const url = isEdit ? `/stations/${currentStation.station_uuid}` : "/stations";
    const method = isEdit ? "put" : "post";

    try {
      await api[method](url, formData);
      setIsModalOpen(false);
      setIsEdit(false);
      fetchStations();
    } catch (error) {
      console.error("Failed to save station", error);
    }
  };

  const handleEdit = (station) => {
    setIsEdit(true);
    setCurrentStation(station);
    setFormData({ ...station });
    setIsModalOpen(true);
  };

  const handleDelete = async (station_uuid) => {
    if (!window.confirm("Are you sure you want to delete this station?")) return;

    try {
      await api.delete(`/stations/${station_uuid}`);
      fetchStations();
    } catch (error) {
      console.error("Failed to delete station", error);
    }
  };

  const columns = [
    { name: "Location", selector: (row) => row.location, sortable: true },
    { name: "Code", selector: (row) => row.code, sortable: true },
    { name: "Bank", selector: (row) => banks.find((b) => b.bank_uuid === row.bank_uuid)?.bank_name || "N/A", sortable: true },
    {
      name: "Actions",
      cell: (row) => (
        <div>
          <button onClick={() => handleEdit(row)} className="text-blue-500 mr-2">Edit</button>
          <button onClick={() => handleDelete(row.station_uuid)} className="text-red-500">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Stations</h1>
      <button
        onClick={() => { setIsEdit(false); setFormData({ location: "", code: "", bank_uuid: "" }); setIsModalOpen(true); }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add Station
      </button>
      <DataTable columns={columns} data={stations} pagination highlightOnHover />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">{isEdit ? "Edit Station" : "Add Station"}</h2>
            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Location</label>
              <input type="text" className="w-full border p-2 rounded mb-2" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}

              <label className="block mb-2">Code</label>
              <input type="text" className="w-full border p-2 rounded mb-2" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
              {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}

              <label className="block mb-2">Bank</label>
              <select className="w-full border p-2 rounded mb-2" value={formData.bank_uuid} onChange={(e) => setFormData({ ...formData, bank_uuid: e.target.value })}>
                <option value="">Select a bank</option>
                {banks.map((bank) => (
                  <option key={bank.bank_uuid} value={bank.bank_uuid}>{bank.bank_name}</option>
                ))}
              </select>
              {errors.bank_uuid && <p className="text-red-500 text-sm">{errors.bank_uuid}</p>}

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">{isEdit ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
