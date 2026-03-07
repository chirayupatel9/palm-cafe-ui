import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Coffee, ArrowLeft } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUtils';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { cafeSettings } = useCafeSettings();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success('Welcome back');
        navigate('/dashboard');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error("We couldn't sign you in. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            {cafeSettings?.logo_url && (
              <img
                src={getImageUrl(cafeSettings?.logo_url ?? null) ?? ''}
                alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`}
                className="h-16 w-16"
              />
            )}
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-secondary-700 dark:text-gray-100">
            Welcome back{cafeSettings?.cafe_name ? ` to ${cafeSettings.cafe_name}` : ''}
          </h2>
          <p className="mt-2 text-center text-sm text-secondary-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                className="input-field mt-1"
                placeholder="Enter your email"
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
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="Enter your password"
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
          </div>

          <div className="w-full">
            <GlassButton
              type="submit"
              disabled={loading}
              size="default"
              className="w-full glass-button-primary"
              contentClassName="flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Coffee className="h-5 w-5" />
                  Sign in
                </>
              )}
            </GlassButton>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-secondary-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-secondary-600 hover:text-secondary-500 dark:text-secondary-400 dark:hover:text-secondary-300"
              >
                Sign up here
              </Link>
            </p>
            <p className="text-sm text-secondary-600 dark:text-gray-400">
              <GlassButton size="default" className="glass-button-secondary" contentClassName="flex items-center gap-2" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </GlassButton>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
