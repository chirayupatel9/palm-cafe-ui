import React, { useState } from 'react';
import { Phone, ArrowRight, UserPlus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CustomerLogin = ({ onLogin, onRegister }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(`/customers/search/${phone}`);
      
      if (response.data.length > 0) {
        const customer = response.data.find(c => c.phone === phone);
        if (customer) {
          toast.success(`Welcome back, ${customer.name}!`);
          onLogin(customer);
        } else {
          toast.error('Phone number not found. Please register first.');
          setShowRegister(true);
        }
      } else {
        toast.error('Phone number not found. Please register first.');
        setShowRegister(true);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      toast.error('Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerData.name.trim() || !registerData.phone.trim()) {
      toast.error('Name and phone number are required');
      return;
    }

    setLoading(true);

    try {
      const customer = await axios.post('/customers', registerData);
      toast.success(`Welcome, ${customer.data.name}! You've been registered successfully.`);
      onLogin(customer.data);
    } catch (error) {
      console.error('Error registering customer:', error);
      toast.error(error.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-accent-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="/images/palm-cafe-logo.png" 
            alt="Palm Cafe Logo" 
            className="h-20 w-20 mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold text-secondary-700 dark:text-secondary-300">
            Welcome to Palm Cafe
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {showRegister ? 'Create your account to start ordering' : 'Enter your phone number to continue'}
          </p>
        </div>

        {!showRegister ? (
          // Login Form
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-secondary-600 hover:text-secondary-500 text-sm flex items-center justify-center mx-auto"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                New customer? Register here
              </button>
            </div>
          </form>
        ) : (
          // Register Form
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                placeholder="Enter your full name"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="registerPhone" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="registerPhone"
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                  placeholder="Enter your phone number"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                placeholder="Enter your email address"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                Address
              </label>
              <textarea
                id="address"
                value={registerData.address}
                onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                placeholder="Enter your address"
                rows="3"
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary-500 hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="text-secondary-600 hover:text-secondary-500 text-sm"
              >
                Already have an account? Login here
              </button>
            </div>
          </form>
        )}

        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By continuing, you agree to our terms of service and privacy policy
          </p>
          <p className="text-sm text-secondary-600 dark:text-gray-400">
            <a 
              href="/" 
              className="font-medium text-secondary-600 hover:text-secondary-500 dark:text-secondary-400 dark:hover:text-secondary-300"
            >
              ← Back to Home
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin; 