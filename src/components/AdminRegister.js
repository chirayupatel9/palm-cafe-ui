import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { user, registerAdmin } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated and is an admin
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              You must be logged in as an admin to register new admins.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-flex items-center px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const result = await registerAdmin(formData.username, formData.email, formData.password);
      
      if (result.success) {
        toast.success('Admin registration successful!');
        navigate('/admin');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img 
              src="/images/palm-cafe-logo.png" 
              alt="Palm Cafe Logo" 
              className="h-16 w-16"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-700 dark:text-gray-100">
            Register New Admin
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-gray-400">
            Create a new admin account for Palm Cafe
          </p>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
              <Shield className="h-4 w-4 mr-2" />
              <span>Logged in as: {user.username}</span>
            </div>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700 dark:text-gray-300">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-accent-300 rounded-lg shadow-sm placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-accent-300 rounded-lg shadow-sm placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 pr-10 border border-accent-300 rounded-lg shadow-sm placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-accent-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-accent-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-secondary-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 pr-10 border border-accent-300 rounded-lg shadow-sm placeholder-accent-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-accent-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-accent-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Register Admin
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/admin"
              className="text-secondary-600 hover:text-secondary-500 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Back to Admin Panel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister; 