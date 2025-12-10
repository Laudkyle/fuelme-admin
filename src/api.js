import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Backend URL

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Function to get the stored access token
const getAccessToken = () => {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData).accessToken : null;
};

// Request Interceptor: Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Refresh token if needed
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
        localStorage.removeItem("userData"); // Logout user if refresh fails
        window.location.href = "/login"; // Redirect to login
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
