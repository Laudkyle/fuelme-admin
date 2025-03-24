import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Cars() {
  const [cars, setCars] = useState([]);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const res = await fetch("/api/cars");
        const data = await res.json();
        setCars(data);
      } catch (error) {
        console.error("Error fetching cars:", error);
      }
    };
    fetchCars();
  }, []);

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
          <button className="text-blue-500 mr-2">Edit</button>
          <button className="text-red-500">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cars</h1>
      <DataTable columns={columns} data={cars} pagination highlightOnHover />
    </div>
  );
}
