import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function Agents() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAgentsAndUsers = async () => {
      try {
        const agentsRes = await fetch("/api/agents");
        const usersRes = await fetch("/api/users");

        const agents = await agentsRes.json();
        const users = await usersRes.json();

        // Merge agents with user data
        const mergedData = agents.map((agent) => {
          const user = users.find((u) => u.user_uuid === agent.user_uuid) || {};
          return {
            agent_uuid: agent.agent_uuid,
            fullname: agent.fullname,
            phone: user.phone || "N/A",
            station_uuid: agent.station_uuid || "N/A",
            transaction_pin: agent.transaction_pin || "N/A",
            date_created: new Date(agent.date_created).toLocaleDateString(),
          };
        });

        setData(mergedData);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };

    fetchAgentsAndUsers();
  }, []);

  const columns = [
    { name: "Agent UUID", selector: (row) => row.agent_uuid, sortable: true },
    { name: "Full Name", selector: (row) => row.fullname, sortable: true },
    { name: "Phone", selector: (row) => row.phone, sortable: true },
    { name: "Station", selector: (row) => row.station_uuid, sortable: true },
    { name: "Transaction PIN", selector: (row) => row.transaction_pin, sortable: true },
    { name: "Created On", selector: (row) => row.date_created, sortable: true },
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
      <h1 className="text-2xl font-bold mb-4">Agents</h1>
      <DataTable columns={columns} data={data} pagination highlightOnHover />
    </div>
  );
}
