import axios from 'axios';

// 1. Get the API URL from Vite's environment variables
// Make sure you have a .env file in your client/ root:
// VITE_API_BASE_URL=http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 2. Create the Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Set up Auth Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 4. Set up Token Refresh Interceptor
apiClient.interceptors.response.use(
  (response) => response, // Directly return successful responses
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refreshToken');

    // Check if it's a 401, we have a refresh token, and we haven't already retried
    if (error.response.status === 401 && refreshToken && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried

      try {
        // Call the Django refresh endpoint (using your new app name)
        const response = await axios.post(`${API_BASE_URL}/api/v1/User_details/login/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        
        // Update local storage and the original request's header
        localStorage.setItem('accessToken', access);
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        // Re-run the original request that failed
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // If refresh fails, log the user out
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login
        window.location.href = '/login'; 
        return Promise.reject(refreshError);
      }
    }
    
    // For all other errors, just reject
    return Promise.reject(error);
  }
);

export default apiClient;
