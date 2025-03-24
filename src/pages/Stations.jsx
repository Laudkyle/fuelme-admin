import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Stations() {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch("/api/stations");
        const data = await res.json();
        setStations(data);
      } catch (error) {
        console.error("Error fetching stations:", error);
      }
    };
    fetchStations();
  }, []);

  const columns = [
    { name: "Station UUID", selector: (row) => row.station_uuid, sortable: true },
    { name: "Location", selector: (row) => row.location, sortable: true },
    { name: "Code", selector: (row) => row.code, sortable: true },
    { name: "Bank UUID", selector: (row) => row.bank_uuid, sortable: true },
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Stations</h1>
      <DataTable columns={columns} data={stations} pagination highlightOnHover />
    </div>
  );
}
