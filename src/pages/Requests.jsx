import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Requests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/requests");
        const data = await res.json();
        setRequests(data);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };
    fetchRequests();
  }, []);

  const columns = [
    { name: "Request UUID", selector: (row) => row.request_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Fuel Amount", selector: (row) => row.fuel, sortable: true },
    { name: "Amount Paid", selector: (row) => row.amount, sortable: true },
    { name: "Station UUID", selector: (row) => row.station_uuid, sortable: true },
    { name: "Car UUID", selector: (row) => row.car_uuid, sortable: true },
    { name: "Agent UUID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Status", selector: (row) => row.status, sortable: true },
    { name: "Date", selector: (row) => new Date(row.datetime).toLocaleDateString(), sortable: true },
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
      <h1 className="text-2xl font-bold mb-4">Requests</h1>
      <DataTable columns={columns} data={requests} pagination highlightOnHover />
    </div>
  );
}
