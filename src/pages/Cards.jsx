import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Cards() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const res = await fetch("/api/cards");
        const data = await res.json();
        setCards(data);
      } catch (error) {
        console.error("Error fetching cards:", error);
      }
    };
    fetchCards();
  }, []);

  const columns = [
    { name: "Card UUID", selector: (row) => row.card_uuid, sortable: true },
    { name: "User UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Card Number", selector: (row) => row.card_number, sortable: true },
    { name: "Expiry Date", selector: (row) => row.expiry_date, sortable: true },
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
      <h1 className="text-2xl font-bold mb-4">Cards</h1>
      <DataTable columns={columns} data={cards} pagination highlightOnHover />
    </div>
  );
}
