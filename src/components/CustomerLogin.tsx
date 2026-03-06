import React, { useState } from 'react';
import { ArrowRight, User, Mail, MapPin, Phone } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { GlassButton } from './ui/GlassButton';

export interface CustomerLoginCustomer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CustomerLoginProps {
  cafeSlug?: string;
  onLogin: (customer: CustomerLoginCustomer) => void;
  onRegister?: (customer: CustomerLoginCustomer) => void;
}

const CustomerLogin: React.FC<CustomerLoginProps> = ({ cafeSlug, onLogin }) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const payload: { email: string; cafeSlug?: string } = { email: trimmed };
      if (cafeSlug) payload.cafeSlug = cafeSlug;
      await axios.post('/customer/send-otp', payload);
      toast.success('Verification code sent to your email');
      setStep('otp');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to send verification code';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !otp.trim()) {
      toast.error('Please enter your email and verification code');
      return;
    }
    setLoading(true);
    try {
      const payload: { email: string; otp: string; cafeSlug?: string } = { email: trimmed, otp: otp.trim() };
      if (cafeSlug) payload.cafeSlug = cafeSlug;
      const response = await axios.post('/customer/login', payload);
      const customer = response.data;
      toast.success(`Welcome back, ${customer.name}!`);
      setStep('email');
      setEmail('');
      setOtp('');
      onLogin(customer);
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('Account not found. Please register first.');
        setRegisterData((prev) => ({ ...prev, email: trimmed }));
        setShowRegister(true);
        setStep('email');
      } else {
        toast.error(error.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!registerData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!registerData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setLoading(true);
    try {
      const dataToSend: Record<string, string> = { ...registerData };
      if (cafeSlug) dataToSend.cafeSlug = cafeSlug;
      const customer = await axios.post('/customer/register', dataToSend);
      toast.success(`Welcome, ${customer.data.name}! You've been registered successfully.`);
      onLogin(customer.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOtp = () => {
    setStep('email');
    setOtp('');
  };

  return (
    <div className="relative w-full max-w-md bg-[#e1e5df] dark:bg-[#0b0f05] rounded-xl shadow-lg p-8 sm:p-10">
      <div className="flex flex-col w-full">
        {!showRegister ? (
          step === 'email' ? (
            <>
              <div className="text-center mb-6">
                <h1 className="text-text-light dark:text-[#e1e5df] tracking-tight text-3xl font-bold leading-tight">
                  Welcome Back!
                </h1>
                <p className="text-text-light/70 dark:text-[#e1e5df]/70 text-base font-normal leading-normal pt-2">
                  Enter your email to receive a login code
                </p>
              </div>
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label
                    className="text-text-light dark:text-[#e1e5df] text-base font-medium leading-normal pb-2"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[#91590b] dark:text-[#a57f42]" />
                    </div>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#e1e5df] focus:outline-0 focus:ring-2 focus:ring-[#334b26]/50 border border-[#b3af9b] dark:border-[#334b26] bg-transparent dark:bg-[#0b0f05] h-14 placeholder:text-[#91590b] dark:placeholder:text-[#a57f42] pl-12 pr-4 text-base font-normal leading-normal"
                      id="email"
                      placeholder="Enter your email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <GlassButton
                  type="submit"
                  disabled={loading}
                  size="default"
                  className="w-full mt-4 glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  contentClassName="w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent border-t-current" />
                  ) : (
                    <>
                      Send verification code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </GlassButton>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-text-light dark:text-[#e1e5df] tracking-tight text-3xl font-bold leading-tight">
                  Enter code
                </h1>
                <p className="text-text-light/70 dark:text-[#e1e5df]/70 text-base font-normal leading-normal pt-2">
                  We sent a 6-digit code to
                </p>
                <p className="font-medium text-text-light dark:text-[#e1e5df] pt-1 break-all">{email}</p>
              </div>
              <form onSubmit={handleLogin} className="flex flex-col gap-4 pb-1">
                <div className="flex flex-col gap-2">
                  <label
                    className="text-text-light dark:text-[#e1e5df] text-base font-medium leading-normal"
                    htmlFor="otp"
                  >
                    Verification code
                  </label>
                  <input
                    className="form-input w-full rounded-lg border border-[#b3af9b] dark:border-[#334b26] bg-[#f5f3ee] dark:bg-[#141a0d] h-14 px-4 text-center text-2xl tracking-[0.4em] font-medium text-[#1a1a1a] dark:text-[#e1e5df] placeholder:text-[#91590b]/50 dark:placeholder:text-[#a57f42]/50 focus:outline-none focus:ring-2 focus:ring-[#334b26]/50 focus:border-[#334b26]"
                    id="otp"
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
                <GlassButton
                  type="submit"
                  disabled={loading || otp.length < 6}
                  size="default"
                  className="w-full mt-4 glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  contentClassName="w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-transparent border-t-current" />
                  ) : (
                    <>
                      Verify & Login
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </GlassButton>
                <button
                  type="button"
                  onClick={handleCloseOtp}
                  className="w-full text-center text-sm text-[#a57f42] hover:underline"
                >
                  Use a different email
                </button>
              </form>
            </>
          )
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-text-light dark:text-[#e1e5df] tracking-tight text-3xl font-bold leading-tight">
                Create Account
              </h1>
              <p className="text-text-light/70 dark:text-[#e1e5df]/70 text-base font-normal leading-normal pt-2">
                Join us to start ordering
              </p>
            </div>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#e1e5df] text-base font-medium leading-normal pb-2"
                  htmlFor="name"
                >
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#91590b] dark:text-[#a57f42]" />
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#e1e5df] focus:outline-0 focus:ring-2 focus:ring-[#334b26]/50 border border-[#b3af9b] dark:border-[#334b26] bg-transparent dark:bg-[#0b0f05] h-14 placeholder:text-[#91590b] dark:placeholder:text-[#a57f42] pl-12 pr-4 text-base font-normal leading-normal"
                    id="name"
                    placeholder="Enter your full name"
                    type="text"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#e1e5df] text-base font-medium leading-normal pb-2"
                  htmlFor="registerEmail"
                >
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#91590b] dark:text-[#a57f42]" />
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#e1e5df] focus:outline-0 focus:ring-2 focus:ring-[#334b26]/50 border border-[#b3af9b] dark:border-[#334b26] bg-transparent dark:bg-[#0b0f05] h-14 placeholder:text-[#91590b] dark:placeholder:text-[#a57f42] pl-12 pr-4 text-base font-normal leading-normal read-only:opacity-90 read-only:cursor-not-allowed read-only:bg-[#b3af9b]/20 dark:read-only:bg-[#334b26]/30"
                    id="registerEmail"
                    placeholder="Enter your email address"
                    type="email"
                    value={registerData.email}
                    readOnly
                    required
                  />
                </div>
                <p className="text-xs text-text-light/60 dark:text-[#e1e5df]/60 mt-1">
                  This is the email you used to receive the verification code.
                </p>
              </div>
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#e1e5df] text-base font-medium leading-normal pb-2"
                  htmlFor="registerPhone"
                >
                  Phone Number *
                </label>
                <div className="relative">
<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-[#91590b] dark:text-[#a57f42]" />
                    </div>
                    <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#e1e5df] focus:outline-0 focus:ring-2 focus:ring-[#334b26]/50 border border-[#b3af9b] dark:border-[#334b26] bg-transparent dark:bg-[#0b0f05] h-14 placeholder:text-[#91590b] dark:placeholder:text-[#a57f42] pl-12 pr-4 text-base font-normal leading-normal"
                    id="registerPhone"
                    placeholder="Enter your phone number"
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label
                  className="text-text-light dark:text-[#e1e5df] text-base font-medium leading-normal pb-2"
                  htmlFor="address"
                >
                  Address
                </label>
                <div className="relative">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-[#91590b] dark:text-[#a57f42]" />
                  </div>
                  <textarea
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-[#e1e5df] focus:outline-0 focus:ring-2 focus:ring-[#334b26]/50 border border-[#b3af9b] dark:border-[#334b26] bg-transparent dark:bg-[#0b0f05] placeholder:text-[#91590b] dark:placeholder:text-[#a57f42] pl-12 pr-4 py-4 text-base font-normal leading-normal"
                    id="address"
                    placeholder="Enter your address"
                    rows={3}
                    value={registerData.address}
                    onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                  />
                </div>
              </div>
              <button
                className="flex items-center justify-center text-center w-full h-14 px-6 py-2 mt-4 text-base font-bold leading-normal rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-on-primary)',
                  ['--tw-ring-color' as string]: 'var(--color-primary)'
                }}
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
          </>
        )}
        {(!showRegister && step === 'email') || showRegister ? (
          <>
            <div className="flex items-center my-8">
              <hr className="flex-grow border-t border-[#b3af9b] dark:border-[#334b26]" />
              <span className="px-4 text-sm text-text-light/60 dark:text-[#e1e5df]/60">Or</span>
              <hr className="flex-grow border-t border-[#b3af9b] dark:border-[#334b26]" />
            </div>
            <div className="text-center">
              <p className="text-text-light dark:text-[#e1e5df] text-base font-normal leading-normal">
                {showRegister ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setShowRegister(false)}
                      className="font-bold text-[#a57f42] hover:underline"
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterData((prev) => ({ ...prev, email: email.trim() }));
                        setShowRegister(true);
                        setStep('email');
                        setEmail('');
                        setOtp('');
                      }}
                      className="font-bold text-[#a57f42] hover:underline"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default CustomerLogin;
