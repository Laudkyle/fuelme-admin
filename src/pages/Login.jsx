import { useState, useContext } from "react";
import { AuthContext } from "../AuthContext";

export default function Login() {
  const [form, setForm] = useState({ phone: "", pin: "" });
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
      await login(form.phone, form.pin);
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
            <label className="block text-sm font-medium text-gray-600">Phone Number</label>
            <input
              type="text"
              name="phone"
              placeholder="Enter your phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-purple-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">PIN</label>
            <input
              type="password"
              name="pin"
              placeholder="Enter your PIN"
              value={form.pin}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring focus:ring-purple-200 focus:outline-none"
            />
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

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="/register" className="text-purple-600 font-medium hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
