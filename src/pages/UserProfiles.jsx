import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";

export default function UsersProfiles() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    email: "",
    address: "",
    category: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsersAndProfiles();
  }, []);
const url = process.env.API_URL
  const fetchUsersAndProfiles = async () => {
    try {
      const usersRes = await fetch(`${url}/api/users`);
      const profilesRes = await fetch(`${url}/api/profiles`);

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

  const validateForm = () => {
    let newErrors = {};
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const url = isEdit ? `/api/users/${currentUser.user_uuid}` : "/api/users";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setIsEdit(false);
        fetchUsersAndProfiles(); // Refresh table
      } else {
        console.error("Failed to save user");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (user) => {
    setIsEdit(true);
    setCurrentUser(user);
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  const handleDelete = async (user_uuid) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/users/${user_uuid}`, { method: "DELETE" });

      if (res.ok) {
        fetchUsersAndProfiles();
      } else {
        console.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

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
          <button onClick={() => handleEdit(row)} className="text-blue-500 mr-2">Edit</button>
          <button onClick={() => handleDelete(row.user_uuid)} className="text-red-500">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Users & Profiles</h1>

      <button
        onClick={() => { setIsEdit(false); setFormData({ phone: "", name: "", email: "", address: "", category: "" }); setIsModalOpen(true); }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        + Add User
      </button>

      <DataTable columns={columns} data={data} pagination highlightOnHover />

      {/* Modal for Adding/Editing User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-bold mb-4">{isEdit ? "Edit User" : "Add User"}</h2>
            <form onSubmit={handleSubmit}>

              <label className="block mb-2">Phone</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}

              <label className="block mb-2">Name</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

              <label className="block mb-2">Email</label>
              <input
                type="email"
                className="w-full border p-2 rounded mb-2"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

              <label className="block mb-2">Address</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}

              <label className="block mb-2">Category</label>
              <input
                type="text"
                className="w-full border p-2 rounded mb-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />

              <div className="flex justify-between mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                  {isEdit ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
