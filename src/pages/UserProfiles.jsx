import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function UsersProfiles() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchUsersAndProfiles = async () => {
      try {
        const usersRes = await fetch("/api/users");
        const profilesRes = await fetch("/api/profiles");

        const users = await usersRes.json();
        const profiles = await profilesRes.json();

        // Merge users with their profiles
        const mergedData = users.map((user) => {
          const profile = profiles.find((p) => p.user_uuid === user.user_uuid) || {};
          return {
            user_uuid: user.user_uuid,
            phone: user.phone,
            name: profile.name || "N/A",
            email: profile.email || "N/A",
            address: profile.address || "N/A",
            category: profile.category || "N/A",
          };
        });

        setData(mergedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchUsersAndProfiles();
  }, []);

  const columns = [
    { name: "UUID", selector: (row) => row.user_uuid, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email, sortable: true },
    { name: "Address", selector: (row) => row.address, sortable: true },
    { name: "Category", selector: (row) => row.category, sortable: true },
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
      <h1 className="text-2xl font-bold mb-4">Users & Profiles</h1>
      <DataTable columns={columns} data={data} pagination highlightOnHover />
    </div>
  );
}
