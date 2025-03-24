import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Momo() {
  const [momo, setMomo] = useState([]);

  useEffect(() => {
    const fetchMomo = async () => {
      try {
        const res = await fetch("/api/momo");
        const data = await res.json();
        setMomo(data);
      } catch (error) {
        console.error("Error fetching MOMO:", error);
      }
    };
    fetchMomo();
  }, []);

  const columns = [
    { name: "MOMO UUID", selector: (row) => row.momo_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Vendor", selector: (row) => row.vendor, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
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
      <h1 className="text-2xl font-bold mb-4">MOMO</h1>
      <DataTable columns={columns} data={momo} pagination highlightOnHover />
    </div>
  );
}
