import { useState, useContext } from "react";
import { AuthContext } from "../AuthContext";

export default function Login() {
  const [form, setForm] = useState({ adminApiKey: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(form.adminApiKey);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-gray-700">Login</h2>
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Admin API Key</label>
            <input
              type="password"
              name="adminApiKey"
              placeholder="Enter Admin API Key"
              value={form.adminApiKey}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-purple-200 focus:outline-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              This key is required to access admin-only endpoints. It is sent as <span className="font-mono">x-admin-api-key</span>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-white font-semibold rounded-md transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          If you do not have an Admin API Key, request one from the system administrator.
        </p>
      </div>
    </div>
  );
}
