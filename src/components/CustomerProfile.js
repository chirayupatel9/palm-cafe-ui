import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, LogOut, CreditCard, Bell, Home } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CustomerProfile = ({ customer, onCustomerUpdate, onLogout, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('account');
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    date_of_birth: customer?.date_of_birth || ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(`/customer/${customer.phone}`, formData);
      toast.success('Profile updated successfully!');
      onCustomerUpdate(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      date_of_birth: customer?.date_of_birth || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#F5F5DC] dark:bg-[#1a1612]">
      {/* Header */}
      <header className="sticky top-0 z-20 w-full border-b border-black/10 dark:border-white/10 bg-[#F5F5DC]/80 dark:bg-[#1a1612]/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold tracking-tight text-text-light dark:text-text-dark">
              My Profile
            </h1>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center h-10 w-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-text-light dark:text-text-dark" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 justify-center p-4 sm:p-6 lg:p-8">
        <div className="flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="flex-shrink-0 lg:w-64">
            <div className="flex h-full flex-col justify-between rounded-xl bg-white dark:bg-[#2c241d] p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-[#f3eee7] dark:border-[#4a2c2a]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6F4E37] text-white">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-text-light dark:text-text-dark text-base font-bold leading-normal">
                      {customer?.name || 'Customer'}
                    </h2>
                    <p className="text-text-light/60 dark:text-text-dark/60 text-sm font-normal leading-normal">
                      {customer?.email || customer?.phone}
                    </p>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveSection('account')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                      activeSection === 'account'
                        ? 'bg-[#6F4E37]/20 text-[#6F4E37]'
                        : 'text-text-light/70 dark:text-text-dark/70 hover:bg-[#6F4E37]/10 hover:text-[#6F4E37]'
                    } transition-colors`}
                  >
                    <User className="h-5 w-5" />
                    <p className="text-sm font-semibold leading-normal">Account</p>
                  </button>
                  <button
                    onClick={() => setActiveSection('payment')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                      activeSection === 'payment'
                        ? 'bg-[#6F4E37]/20 text-[#6F4E37]'
                        : 'text-text-light/70 dark:text-text-dark/70 hover:bg-[#6F4E37]/10 hover:text-[#6F4E37]'
                    } transition-colors`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <p className="text-sm font-medium leading-normal">Payment Methods</p>
                  </button>
                  <button
                    onClick={() => setActiveSection('addresses')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                      activeSection === 'addresses'
                        ? 'bg-[#6F4E37]/20 text-[#6F4E37]'
                        : 'text-text-light/70 dark:text-text-dark/70 hover:bg-[#6F4E37]/10 hover:text-[#6F4E37]'
                    } transition-colors`}
                  >
                    <Home className="h-5 w-5" />
                    <p className="text-sm font-medium leading-normal">Delivery Addresses</p>
                  </button>
                  <button
                    onClick={() => setActiveSection('notifications')}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                      activeSection === 'notifications'
                        ? 'bg-[#6F4E37]/20 text-[#6F4E37]'
                        : 'text-text-light/70 dark:text-text-dark/70 hover:bg-[#6F4E37]/10 hover:text-[#6F4E37]'
                    } transition-colors`}
                  >
                    <Bell className="h-5 w-5" />
                    <p className="text-sm font-medium leading-normal">Notifications</p>
                  </button>
                </div>
              </div>

              {/* Logout Button */}
              <div className="flex flex-col gap-4 pt-8">
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-[#6F4E37]/10 text-[#6F4E37] text-sm font-bold leading-normal hover:bg-[#6F4E37]/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 rounded-xl bg-white dark:bg-[#2c241d] shadow-sm">
            <div className="flex flex-col gap-8 p-6 md:p-8">
              {activeSection === 'account' && (
                <>
                  {/* Page Heading */}
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="flex flex-col gap-2">
                      <p className="text-text-light dark:text-text-dark text-3xl font-bold leading-tight tracking-tight">
                        Account Information
                      </p>
                      <p className="text-text-light/60 dark:text-text-dark/60 text-base font-normal leading-normal">
                        Update your personal details and manage your account.
                      </p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 rounded-lg h-11 px-5 bg-[#6F4E37] text-white text-sm font-bold hover:bg-[#6F4E37]/90 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </div>

                  {/* Personal Information Form */}
                  <form onSubmit={handleSave} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <label className="flex flex-col">
                        <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal pb-2">
                          Full Name *
                        </p>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={!isEditing}
                          className="form-input flex w-full rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border-2 border-[#f3eee7] dark:border-[#4a2c2a] bg-white dark:bg-[#2c241d] h-12 px-4 text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed"
                          required
                        />
                      </label>

                      <label className="flex flex-col">
                        <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal pb-2">
                          Phone Number
                        </p>
                        <input
                          type="tel"
                          value={formData.phone}
                          disabled
                          className="form-input flex w-full rounded-lg text-text-light dark:text-text-dark border-2 border-[#f3eee7] dark:border-[#4a2c2a] bg-[#f3eee7] dark:bg-[#2c241d] h-12 px-4 text-base font-normal opacity-60 cursor-not-allowed"
                        />
                      </label>

                      <label className="flex flex-col">
                        <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal pb-2">
                          Email Address
                        </p>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                          className="form-input flex w-full rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border-2 border-[#f3eee7] dark:border-[#4a2c2a] bg-white dark:bg-[#2c241d] h-12 px-4 text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </label>

                      <label className="flex flex-col">
                        <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal pb-2">
                          Date of Birth
                        </p>
                        <input
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                          disabled={!isEditing}
                          className="form-input flex w-full rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border-2 border-[#f3eee7] dark:border-[#4a2c2a] bg-white dark:bg-[#2c241d] h-12 px-4 text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col">
                      <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal pb-2">
                        Address
                      </p>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        disabled={!isEditing}
                        rows="3"
                        className="form-input flex w-full rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#6F4E37]/50 border-2 border-[#f3eee7] dark:border-[#4a2c2a] bg-white dark:bg-[#2c241d] px-4 py-3 text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                      />
                    </label>

                    {isEditing && (
                      <div className="flex justify-end gap-3 pt-4 border-t border-[#f3eee7] dark:border-[#4a2c2a]">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="flex items-center justify-center rounded-lg h-11 px-5 bg-transparent text-text-light/60 dark:text-text-dark/60 text-sm font-bold hover:bg-[#6F4E37]/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center justify-center gap-2 rounded-lg h-11 px-5 bg-[#6F4E37] text-white text-sm font-bold hover:bg-[#6F4E37]/90 transition-colors disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}

              {activeSection === 'payment' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-16 w-16 text-text-light/40 dark:text-text-dark/40 mb-4" />
                  <p className="text-text-light dark:text-text-dark text-xl font-bold mb-2">Payment Methods</p>
                  <p className="text-text-light/60 dark:text-text-dark/60 text-center">Coming soon...</p>
                </div>
              )}

              {activeSection === 'addresses' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Home className="h-16 w-16 text-text-light/40 dark:text-text-dark/40 mb-4" />
                  <p className="text-text-light dark:text-text-dark text-xl font-bold mb-2">Delivery Addresses</p>
                  <p className="text-text-light/60 dark:text-text-dark/60 text-center">Coming soon...</p>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-16 w-16 text-text-light/40 dark:text-text-dark/40 mb-4" />
                  <p className="text-text-light dark:text-text-dark text-xl font-bold mb-2">Notification Settings</p>
                  <p className="text-text-light/60 dark:text-text-dark/60 text-center">Coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerProfile;
