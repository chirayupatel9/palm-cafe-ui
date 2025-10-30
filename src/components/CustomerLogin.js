import React, { useState } from 'react';
import { Phone, ArrowRight, UserPlus, User, Mail, MapPin } from 'lucide-react';
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
      const response = await axios.post('/customer/login', { phone });
      
      if (response.data) {
        const customer = response.data;
        toast.success(`Welcome back, ${customer.name}!`);
        onLogin(customer);
      } else {
        toast.error('Phone number not found. Please register first.');
        setShowRegister(true);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      if (error.response?.status === 404) {
        toast.error('Phone number not found. Please register first.');
        setShowRegister(true);
      } else {
        toast.error('Failed to verify phone number');
      }
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
      const customer = await axios.post('/customer/register', registerData);
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
    <div className="relative w-full max-w-md bg-white dark:bg-[#221a10] rounded-xl shadow-lg p-8 sm:p-10">
      <div className="flex flex-col w-full">
        {!showRegister ? (
          // Login Form
          <>
            <div className="text-center mb-6">
              <h1 className="text-text-light dark:text-[#F5F5DC] tracking-tight text-3xl font-bold leading-tight">
                Welcome Back!
              </h1>
              <p className="text-text-light/70 dark:text-[#F5F5DC]/70 text-base font-normal leading-normal pt-2">
                Login to your account to continue
              </p>
            </div>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#F5F5DC] text-base font-medium leading-normal pb-2"
                  htmlFor="phone"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-[#9a794c] dark:text-[#8a6d4c]" />
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#F5F5DC] focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border border-[#e7ddcf] dark:border-[#443d34] bg-transparent dark:bg-[#221a10] h-14 placeholder:text-[#9a794c] dark:placeholder:text-[#8a6d4c] pl-12 pr-4 text-base font-normal leading-normal"
                    id="phone"
                    placeholder="Enter your phone number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button
                className="flex items-center justify-center text-center w-full h-14 px-6 py-2 mt-4 text-base font-bold leading-normal text-white bg-[#6F4E37] rounded-lg hover:bg-[#6F4E37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6F4E37] dark:focus:ring-offset-[#1a1612] transition-colors disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
            <div className="flex items-center my-8">
              <hr className="flex-grow border-t border-[#e7ddcf] dark:border-[#443d34]" />
              <span className="px-4 text-sm text-text-light/60 dark:text-[#F5F5DC]/60">Or</span>
              <hr className="flex-grow border-t border-[#e7ddcf] dark:border-[#443d34]" />
            </div>
            <div className="text-center">
              <p className="text-text-light dark:text-[#F5F5DC] text-base font-normal leading-normal">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="font-bold text-[#C8A165] hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </>
        ) : (
          // Register Form
          <>
            <div className="text-center mb-6">
              <h1 className="text-text-light dark:text-[#F5F5DC] tracking-tight text-3xl font-bold leading-tight">
                Create Account
              </h1>
              <p className="text-text-light/70 dark:text-[#F5F5DC]/70 text-base font-normal leading-normal pt-2">
                Join us to start ordering
              </p>
            </div>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#F5F5DC] text-base font-medium leading-normal pb-2"
                  htmlFor="name"
                >
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#9a794c] dark:text-[#8a6d4c]" />
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#F5F5DC] focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border border-[#e7ddcf] dark:border-[#443d34] bg-transparent dark:bg-[#221a10] h-14 placeholder:text-[#9a794c] dark:placeholder:text-[#8a6d4c] pl-12 pr-4 text-base font-normal leading-normal"
                    id="name"
                    placeholder="Enter your full name"
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#F5F5DC] text-base font-medium leading-normal pb-2"
                  htmlFor="registerPhone"
                >
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-[#9a794c] dark:text-[#8a6d4c]" />
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#F5F5DC] focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border border-[#e7ddcf] dark:border-[#443d34] bg-transparent dark:bg-[#221a10] h-14 placeholder:text-[#9a794c] dark:placeholder:text-[#8a6d4c] pl-12 pr-4 text-base font-normal leading-normal"
                    id="registerPhone"
                    placeholder="Enter your phone number"
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#F5F5DC] text-base font-medium leading-normal pb-2"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#9a794c] dark:text-[#8a6d4c]" />
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#F5F5DC] focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border border-[#e7ddcf] dark:border-[#443d34] bg-transparent dark:bg-[#221a10] h-14 placeholder:text-[#9a794c] dark:placeholder:text-[#8a6d4c] pl-12 pr-4 text-base font-normal leading-normal"
                    id="email"
                    placeholder="Enter your email address"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#F5F5DC] text-base font-medium leading-normal pb-2"
                  htmlFor="address"
                >
                  Address
                </label>
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-[#9a794c] dark:text-[#8a6d4c]" />
                  </div>
                  <textarea
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#F5F5DC] focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border border-[#e7ddcf] dark:border-[#443d34] bg-transparent dark:bg-[#221a10] placeholder:text-[#9a794c] dark:placeholder:text-[#8a6d4c] pl-12 pr-4 py-4 text-base font-normal leading-normal"
                    id="address"
                    placeholder="Enter your address"
                    rows="3"
                    value={registerData.address}
                    onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                  />
                </div>
              </div>
              <button
                className="flex items-center justify-center text-center w-full h-14 px-6 py-2 mt-4 text-base font-bold leading-normal text-white bg-[#6F4E37] rounded-lg hover:bg-[#6F4E37]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6F4E37] dark:focus:ring-offset-[#1a1612] transition-colors disabled:opacity-50"
                type="submit"
                disabled={loading}
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
            </form>
            <div className="flex items-center my-8">
              <hr className="flex-grow border-t border-[#e7ddcf] dark:border-[#443d34]" />
              <span className="px-4 text-sm text-text-light/60 dark:text-[#F5F5DC]/60">Or</span>
              <hr className="flex-grow border-t border-[#e7ddcf] dark:border-[#443d34]" />
            </div>
            <div className="text-center">
              <p className="text-text-light dark:text-[#F5F5DC] text-base font-normal leading-normal">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegister(false)}
                  className="font-bold text-[#C8A165] hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerLogin; 