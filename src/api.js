import axios from "axios";

// Backend URL
// Prefer environment override (Create React App convention)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api";

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Function to get the stored access token (optional)
const getAccessToken = () => {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData).accessToken : null;
};

// Function to get the admin API key (preferred for admin frontend)
const getAdminApiKey = () => {
  // 1) explicit key stored by admin login
  const direct = localStorage.getItem("adminApiKey");
  if (direct) return direct;

  // 2) legacy userData storage
  const userData = localStorage.getItem("userData");
  const parsed = userData ? JSON.parse(userData) : null;
  if (parsed?.adminApiKey) return parsed.adminApiKey;

  // 3) environment variable
  return process.env.REACT_APP_ADMIN_API_KEY || null;
};

// Request Interceptor: Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Admin authentication (backend expects x-admin-api-key)
    const adminKey = getAdminApiKey();
    if (adminKey) {
      config.headers["x-admin-api-key"] = adminKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Refresh token if needed (optional; only used if you rely on JWT access tokens)
api.interceptors.response.use(
  (response) => response, // Return response if successful
  async (error) => {
    const originalRequest = error.config;

    // If Unauthorized (401) and no retry yet, try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const userData = JSON.parse(localStorage.getItem("userData"));
        const refreshToken = userData?.refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token found.");
        }

        // Request a new access token
        const { data } = await axios.post(`${API_BASE_URL}/users/refresh`, { refreshToken });

        // Save new tokens
        const updatedUserData = { ...userData, accessToken: data.accessToken };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));

        // Retry the failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        console.error("Token refresh failed:", err);
        localStorage.removeItem("userData");
        // Keep adminApiKey if present; admin auth does not require refresh
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
