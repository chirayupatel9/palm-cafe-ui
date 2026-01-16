import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { Eye, EyeOff, Crown, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUtils';

const SuperadminRegister = ({ onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { registerSuperadmin } = useAuth();
  const { cafeSettings } = useCafeSettings();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const result = await registerSuperadmin(formData.username, formData.email, formData.password);
      
      if (result.success) {
        toast.success('Superadmin registered successfully!');
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        if (onBack) {
          onBack();
        }
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
            {cafeSettings.logo_url && (
              <img 
                src={getImageUrl(cafeSettings.logo_url)} 
                alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
                className="h-16 w-16"
              />
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-700 dark:text-gray-100">
            Register New Superadmin
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-gray-400">
            Create a new superadmin account{cafeSettings.cafe_name ? ` for ${cafeSettings.cafe_name}` : ''}
          </p>
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
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-accent-300 dark:border-gray-600 placeholder-accent-500 dark:placeholder-gray-400 text-secondary-900 dark:text-gray-100 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 focus:z-10 sm:text-sm"
                placeholder="Enter username"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-accent-300 dark:border-gray-600 placeholder-accent-500 dark:placeholder-gray-400 text-secondary-900 dark:text-gray-100 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 focus:z-10 sm:text-sm"
                placeholder="Enter email address"
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-accent-300 dark:border-gray-600 placeholder-accent-500 dark:placeholder-gray-400 text-secondary-900 dark:text-gray-100 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 focus:z-10 sm:text-sm"
                  placeholder="Enter password (min 6 characters)"
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
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-accent-300 dark:border-gray-600 placeholder-accent-500 dark:placeholder-gray-400 text-secondary-900 dark:text-gray-100 bg-white dark:bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 focus:z-10 sm:text-sm"
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

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Register Superadmin
                </>
              )}
            </button>
            
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="group relative w-full flex justify-center py-2 px-4 border border-accent-300 dark:border-gray-600 text-sm font-medium rounded-lg text-secondary-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-accent-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to User Management
              </button>
            )}
          </div>

          <div className="text-center">
            <p className="text-sm text-secondary-600 dark:text-gray-400">
              ⚠️ Warning: Superadmin accounts have full system access and can manage all users and settings.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperadminRegister; 