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

// Decode JWT payload without verifying signature (#8)
const parseJwt = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

// Return true when the token expires within 60 seconds (#8)
const isTokenExpiringSoon = (token) => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return false;
  return (payload.exp - Date.now() / 1000) < 60;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [impersonation, setImpersonation] = useState(null);

  // Internal logout helper (no circular dependency)
  const clearSession = () => {
    setUser(null);
    setToken(null);
    setImpersonation(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    document.title = 'Cafe Management System';
    window.dispatchEvent(new Event('app:logout'));
  };

  // Set up axios interceptors once on mount
  useEffect(() => {
    // Request interceptor: add Authorization + X-Request-ID (#17), check token expiry (#8)
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('token');

      // Proactive token expiry check (#8)
      if (currentToken && isTokenExpiringSoon(currentToken)) {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(new Error('Token expiring soon'));
      }

      if (currentToken) {
        config.headers['Authorization'] = `Bearer ${currentToken}`;
      }

      // Add X-Request-ID for end-to-end tracing (#17)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        config.headers['X-Request-ID'] = crypto.randomUUID();
      }

      return config;
    });

    // Response interceptor: handle 429 (#5) and 403 FEATURE_ACCESS_DENIED (#15)
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '900', 10);
          const minutes = Math.ceil(retryAfter / 60);
          toast.error(`Too many attempts. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
        }

        if (error.response?.status === 403) {
          const { code, feature, current_plan } = error.response.data || {};
          if (code === 'FEATURE_ACCESS_DENIED') {
            toast.error(
              `${feature || 'This feature'} is not available on your ${current_plan || 'current'} plan.`,
              { duration: 5000 }
            );
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep axios default header in sync with token state
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
      if (window.location.pathname === '/customer' ||
          window.location.pathname.startsWith('/customer/') ||
          window.location.pathname.startsWith('/cafe/')) {
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

          clearSession();
        }
      } else {
        // Reset title when logged out
        document.title = 'Cafe Management System';
        setImpersonation(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // 429 toast is shown by the response interceptor
      if (error.response?.status === 429) {
        return { success: false, error: null };
      }

      // Handle disabled account (#6)
      if (error.response?.status === 401) {
        const errMsg = error.response?.data?.error || '';
        if (errMsg.toLowerCase().includes('disabled')) {
          return { success: false, error: 'Your account has been disabled. Please contact support.' };
        }
      }

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
      await axios.post('/auth/register-admin', { username, email, password });
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
      await axios.post('/auth/register-chef', { username, email, password });
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
      await axios.post('/auth/register-reception', { username, email, password });
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
      await axios.post('/auth/register-superadmin', { username, email, password });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Superadmin registration failed'
      };
    }
  };

  const logout = () => {
    clearSession();
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
