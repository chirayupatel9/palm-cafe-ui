import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface User {
  id?: number;
  email?: string;
  username?: string;
  role?: string;
  cafe_id?: number;
  cafe_name?: string;
  [key: string]: unknown;
}

export interface Impersonation {
  isImpersonating: boolean;
  cafeId?: number;
  cafeSlug?: string;
  [key: string]: unknown;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  impersonation: Impersonation | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerAdmin: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerChef: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerReception: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerSuperadmin: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  startImpersonation: (cafeSlug: string) => Promise<{ success: boolean; user?: User; impersonation?: Impersonation; error?: string }>;
  exitImpersonation: () => Promise<{ success: boolean; user?: User; error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const parseJwt = (token: string): { exp?: number; [key: string]: unknown } | null => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
  } catch {
    return null;
  }
};

const isTokenExpiringSoon = (token: string): boolean => {
  const payload = parseJwt(token);
  if (!payload || payload.exp == null) return false;
  return payload.exp - Date.now() / 1000 < 60;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [impersonation, setImpersonation] = useState<Impersonation | null>(null);

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

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && isTokenExpiringSoon(currentToken)) {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(new Error('Token expiring soon'));
      }
      if (currentToken) {
        config.headers['Authorization'] = `Bearer ${currentToken}`;
      }
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        config.headers['X-Request-ID'] = crypto.randomUUID();
      }
      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '900', 10);
          const minutes = Math.ceil(retryAfter / 60);
          toast.error(`Too many attempts. Please wait ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
        }
        if (error.response?.status === 403) {
          const { code } = error.response.data || {};
          if (code === 'FEATURE_ACCESS_DENIED') {
            toast.error('Locked feature. Upgrade your plan to access.', { duration: 4000 });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    const checkAuth = async () => {
      if (
        window.location.pathname === '/customer' ||
        window.location.pathname.startsWith('/customer/') ||
        window.location.pathname.startsWith('/cafe/')
      ) {
        setLoading(false);
        return;
      }
      if (token) {
        try {
          const response = await axios.get('/auth/profile');
          const userData = response.data.user as User;
          const impersonationData = (response.data.impersonation || { isImpersonating: false }) as Impersonation;
          setUser(userData);
          setImpersonation(impersonationData);
          if (userData.cafe_name) {
            document.title = userData.cafe_name;
          } else if (userData.role === 'superadmin') {
            document.title = 'Super Admin Dashboard';
          } else {
            document.title = 'Cafe Management System';
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          const err = error as { response?: { data?: { code?: string } } };
          if (err.response?.data?.code === 'TOKEN_EXPIRED') {
            toast.error('Session expired. Please log in again.');
          } else if (err.response?.data?.code === 'INVALID_TOKEN') {
            toast.error('Invalid session. Please log in again.');
          }
          clearSession();
        }
      } else {
        document.title = 'Cafe Management System';
        setImpersonation(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      setImpersonation({ isImpersonating: false });
      localStorage.setItem('token', authToken);
      if (userData.cafe_name) {
        document.title = userData.cafe_name;
      } else if (userData.role === 'superadmin') {
        document.title = 'Super Admin Dashboard';
      } else {
        document.title = 'Cafe Management System';
      }
      return { success: true, user: userData };
    } catch (error) {
      const err = error as { response?: { status?: number; data?: { error?: string } } };
      if (err.response?.status === 429) {
        return { success: false, error: undefined };
      }
      if (err.response?.status === 401) {
        const errMsg = err.response?.data?.error || '';
        if (errMsg.toLowerCase().includes('disabled')) {
          return { success: false, error: 'Your account has been disabled. Please contact support.' };
        }
      }
      return {
        success: false,
        error: err.response?.data?.error || 'Login failed'
      };
    }
  };

  const startImpersonation = async (cafeSlug: string) => {
    try {
      const response = await axios.post('/superadmin/impersonate-cafe', { cafeSlug });
      const { user: userData, token: authToken, impersonation: impersonationData } = response.data;
      setUser(userData);
      setToken(authToken);
      setImpersonation(impersonationData);
      localStorage.setItem('token', authToken);
      if (userData.cafe_name) document.title = userData.cafe_name;
      toast.success(response.data.message || 'Impersonation started');
      return { success: true, user: userData, impersonation: impersonationData };
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to start impersonation');
      return { success: false, error: err.response?.data?.error || 'Failed to start impersonation' };
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
      document.title = userData.role === 'superadmin' ? 'Super Admin Dashboard' : 'Cafe Management System';
      toast.success(response.data.message || 'Impersonation ended');
      return { success: true, user: userData };
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Failed to exit impersonation');
      return { success: false, error: err.response?.data?.error || 'Failed to exit impersonation' };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('/auth/register', { username, email, password });
      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      return { success: true };
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  };

  const registerAdmin = async (username: string, email: string, password: string) => {
    try {
      await axios.post('/auth/register-admin', { username, email, password });
      return { success: true };
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      return { success: false, error: err.response?.data?.error || 'Admin registration failed' };
    }
  };

  const registerChef = async (username: string, email: string, password: string) => {
    try {
      await axios.post('/auth/register-chef', { username, email, password });
      return { success: true };
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      return { success: false, error: err.response?.data?.error || 'Chef registration failed' };
    }
  };

  const registerReception = async (username: string, email: string, password: string) => {
    try {
      await axios.post('/auth/register-reception', { username, email, password });
      return { success: true };
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      return { success: false, error: err.response?.data?.error || 'Reception registration failed' };
    }
  };

  const registerSuperadmin = async (username: string, email: string, password: string) => {
    try {
      await axios.post('/auth/register-superadmin', { username, email, password });
      return { success: true };
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      return { success: false, error: err.response?.data?.error || 'Superadmin registration failed' };
    }
  };

  const logout = () => clearSession();

  const value: AuthContextValue = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
