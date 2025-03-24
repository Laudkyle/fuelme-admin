import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Banks() {
  const [banks, setBanks] = useState([]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();
        setBanks(data);
      } catch (error) {
        console.error("Error fetching banks:", error);
      }
    };
    fetchBanks();
  }, []);

  const columns = [
    { name: "Bank UUID", selector: (row) => row.bank_uuid, sortable: true },
    { name: "Bank Name", selector: (row) => row.bank_name, sortable: true },
    { name: "Account Number", selector: (row) => row.account_number, sortable: true },
    { name: "Location", selector: (row) => row.location, sortable: true },
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
      <h1 className="text-2xl font-bold mb-4">Banks</h1>
      <DataTable columns={columns} data={banks} pagination highlightOnHover />
    </div>
  );
}
