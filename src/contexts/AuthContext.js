import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [impersonation, setImpersonation] = useState(null);

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check on customer routes (public routes don't need admin auth)
      if (window.location.pathname === '/customer' || window.location.pathname.startsWith('/customer/')) {
        setLoading(false);
        return;
      }

      if (token) {
        try {
          const response = await axios.get('/auth/profile');
          const userData = response.data.user;
          const impersonationData = response.data.impersonation || { isImpersonating: false };
          
          setUser(userData);
          setImpersonation(impersonationData);
          
          // Update document title with cafe name if available
          if (userData.cafe_name) {
            document.title = userData.cafe_name;
          } else if (userData.role === 'superadmin') {
            document.title = 'Super Admin Dashboard';
          } else {
            document.title = 'Cafe Management System';
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          
          // Handle specific token errors
          if (error.response?.data?.code === 'TOKEN_EXPIRED') {
            toast.error('Session expired. Please log in again.');
          } else if (error.response?.data?.code === 'INVALID_TOKEN') {
            toast.error('Invalid session. Please log in again.');
          }
          
          logout();
        }
      } else {
        // Reset title when logged out
        document.title = 'Palm Cafe Management System';
        setImpersonation(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data;
      
      setUser(userData);
      setToken(authToken);
      setImpersonation({ isImpersonating: false });
      localStorage.setItem('token', authToken);
      
      // Update document title with cafe name if available
      if (userData.cafe_name) {
        document.title = userData.cafe_name;
      } else if (userData.role === 'superadmin') {
        document.title = 'Super Admin Dashboard';
      } else {
        document.title = 'Cafe Management System';
      }
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const startImpersonation = async (cafeSlug) => {
    try {
      const response = await axios.post('/superadmin/impersonate-cafe', { cafeSlug });
      const { user: userData, token: authToken, impersonation: impersonationData } = response.data;
      
      setUser(userData);
      setToken(authToken);
      setImpersonation(impersonationData);
      localStorage.setItem('token', authToken);
      
      // Update document title
      if (userData.cafe_name) {
        document.title = userData.cafe_name;
      }
      
      toast.success(response.data.message || 'Impersonation started');
      return { success: true, user: userData, impersonation: impersonationData };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start impersonation');
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to start impersonation' 
      };
    }
  };

  const exitImpersonation = async () => {
    try {
      const response = await axios.post('/superadmin/exit-impersonation');
      const { user: userData, token: authToken } = response.data;
      
      setUser(userData);
      setToken(authToken);
      setImpersonation({ isImpersonating: false });
      localStorage.setItem('token', authToken);
      
      // Update document title
      if (userData.role === 'superadmin') {
        document.title = 'Super Admin Dashboard';
      } else {
        document.title = 'Cafe Management System';
      }
      
      toast.success(response.data.message || 'Impersonation ended');
      return { success: true, user: userData };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to exit impersonation');
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to exit impersonation' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register', { username, email, password });
      const { user: userData, token: authToken } = response.data;
      
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const registerAdmin = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register-admin', { username, email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Admin registration failed' 
      };
    }
  };

  const registerChef = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register-chef', { username, email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Chef registration failed' 
      };
    }
  };

  const registerReception = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register-reception', { username, email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Reception registration failed' 
      };
    }
  };

  const registerSuperadmin = async (username, email, password) => {
    try {
      const response = await axios.post('/auth/register-superadmin', { username, email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Superadmin registration failed' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setImpersonation(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    // Reset title on logout
    document.title = 'Palm Cafe Management System';
  };

  const value = {
    user,
    token,
    loading,
    impersonation,
    login,
    register,
    registerAdmin,
    registerChef,
    registerReception,
    registerSuperadmin,
    logout,
    startImpersonation,
    exitImpersonation,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 