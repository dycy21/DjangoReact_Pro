import React, { 
  useState, 
  useEffect, 
  createContext, 
  useContext, 
  useMemo 
} from 'react';
import apiClient from '../api/apiClient.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state for auth check

  // On app load, check if tokens are in localStorage
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && refreshToken) {
      try {
        // Decode user info from token (unsafe, but simple)
        // A better way: fetch a '/api/v1/User_details/me/' endpoint
        const userData = JSON.parse(atob(accessToken.split('.')[1]));
        setUser({ email: userData.email, id: userData.user_id });
      } catch (e) {
        console.error("Failed to decode token, logging out.");
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Use new endpoint
      const response = await apiClient.post('/api/v1/User_details/login/', {
        email,
        password,
      });
      const { access, refresh } = response.data;
      
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Decode user info from token
      const userData = JSON.parse(atob(access.split('.')[1]));
      setUser({ email: userData.email, id: userData.user_id });

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error.response?.data);
      return { success: false, error: error.response?.data?.detail || 'Login failed.' };
    }
  };

  const register = async (username, email, password, password2) => {
    try {
      // Use new endpoint
      await apiClient.post('/api/v1/User_details/register/', {
        username,
        email,
        password,
        password2,
      });
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error.response?.data);
      return { success: false, error: error.response?.data };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // We'll let the router handle the redirect
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    register,
  }), [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily access auth state
export const useAuth = () => {
  return useContext(AuthContext);
};

