import React, { useState, useEffect } from 'react';
import { User, CreditCard, Bell, Home, Package, Edit3, Save, X, LogOut } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CustomerOrderHistory from './CustomerOrderHistory';

export interface CustomerProfileCustomer {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  [key: string]: unknown;
}

interface CartItem {
  id: number;
  [key: string]: unknown;
}

interface CustomerProfileProps {
  customer: CustomerProfileCustomer | null;
  onCustomerUpdate: (customer: CustomerProfileCustomer) => void;
  onLogout: () => void;
  onClose?: () => void;
  initialSection?: string;
  setActiveTab?: (tab: string) => void;
  cart?: CartItem[];
  setCart?: React.Dispatch<React.SetStateAction<CartItem[]>>;
  embedded?: boolean;
  cafeSlug?: string;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer,
  onCustomerUpdate,
  onLogout,
  onClose,
  initialSection,
  setActiveTab,
  cart = [],
  setCart,
  embedded,
  cafeSlug
}) => {
  const hasTabAndCart = typeof setActiveTab === 'function' && typeof setCart === 'function';
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(initialSection || 'account');
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    date_of_birth: customer?.date_of_birth || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!customer?.id) {
      toast.error('Cannot update profile: customer ID is missing. Please log in again.');
      return;
    }
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        id: customer.id,
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        date_of_birth: formData.date_of_birth || null
      };
      if (cafeSlug) payload.cafeSlug = cafeSlug;
      const response = await axios.put('/customer/profile', payload);
      toast.success('Profile updated successfully!');
      onCustomerUpdate({ ...customer, ...response.data });
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

  useEffect(() => {
    if (initialSection) setActiveSection(initialSection);
  }, [initialSection]);

  const renderSectionContent = () => (
    <>
      {activeSection === 'account' && (
        <>
          <div className="flex flex-wrap justify-between gap-4 mb-2">
            <div className="flex flex-col gap-3">
              <p className="text-text-light dark:text-text-dark text-3xl font-bold leading-tight tracking-tight">
                Account Information
              </p>
              <p className="text-text-light/60 dark:text-text-dark/60 text-base font-normal leading-normal">
                Update your personal details and manage your account.
              </p>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-full h-10 px-5 elevation-2 bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-all"
              >
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
          <form onSubmit={handleSave} className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Full Name *</p>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  className="form-input flex w-full rounded-lg h-12 px-4 py-3 text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#a57f42]/30 focus:ring-inset text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed bg-transparent border-b-2 border-[#b3af9b] focus:border-[#a57f42] transition-colors"
                  style={{ color: 'var(--color-on-surface)' }}
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Phone Number</p>
                <input
                  type="tel"
                  value={formData.phone}
                  disabled
                  className="form-input flex w-full rounded-lg h-12 px-4 py-3 text-text-light dark:text-text-dark text-base font-normal opacity-60 cursor-not-allowed bg-transparent border-b-2 border-[#b3af9b]"
                />
              </label>
              <label className="flex flex-col gap-2">
                <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Email Address</p>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!isEditing}
                  className="form-input flex w-full rounded-lg h-12 px-4 py-3 text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#a57f42]/30 focus:ring-inset text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed bg-transparent border-b-2 border-[#b3af9b] focus:border-[#a57f42] transition-colors"
                  style={{ color: 'var(--color-on-surface)' }}
                />
              </label>
              <label className="flex flex-col gap-2">
                <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Date of Birth</p>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  disabled={!isEditing}
                  className="form-input flex w-full rounded-lg h-12 px-4 py-3 text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#a57f42]/30 focus:ring-inset text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed bg-transparent border-b-2 border-[#b3af9b] focus:border-[#a57f42] transition-colors"
                  style={{ color: 'var(--color-on-surface)' }}
                />
              </label>
            </div>
            <label className="flex flex-col gap-2">
              <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Address</p>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className="form-input flex w-full rounded-lg px-4 py-3 text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-[#a57f42]/30 focus:ring-inset text-base font-normal disabled:opacity-60 disabled:cursor-not-allowed resize-none bg-transparent border-b-2 border-[#b3af9b] focus:border-[#a57f42] transition-colors"
                style={{ color: 'var(--color-on-surface)' }}
              />
            </label>
            {isEditing && (
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center justify-center rounded-full h-10 px-5 bg-transparent text-text-light/60 dark:text-text-dark/60 text-sm font-medium hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-full h-10 px-5 elevation-2 bg-primary text-on-primary text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
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
      {activeSection === 'orders' && (
        <div className="flex flex-col gap-6 -m-2">
          {hasTabAndCart ? (
            <CustomerOrderHistory
              customerPhone={customer?.phone}
              setActiveTab={setActiveTab}
              cart={cart as any}
              setCart={setCart! as any}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <p className="text-text-light dark:text-text-dark font-medium">
                Order history is available when opened from the menu.
              </p>
              <p className="text-text-light/60 dark:text-text-dark/60 text-sm mt-1">
                Cart and navigation are required for reordering.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="relative flex h-auto min-h-0 w-full flex-col">
      {!embedded && (
        <header
          className="sticky top-0 z-20 w-full border-b backdrop-blur-sm"
          style={{ borderColor: 'var(--color-outline)' }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold tracking-tight text-text-light dark:text-text-dark">My Profile</h1>
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
      )}
      <main className={`flex flex-1 justify-center ${embedded ? 'p-0 pt-2' : 'p-4 sm:p-6 lg:p-8'}`}>
        <div className={`flex w-full max-w-6xl flex-col gap-6 ${embedded ? 'min-w-0' : 'lg:flex-row lg:gap-8'}`}>
          {embedded ? (
            <>
              <div className="flex items-center justify-between gap-4 py-5 px-2">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#a57f42] text-on-primary elevation-2">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#0b0f05] font-bold text-base truncate">{customer?.name || 'Customer'}</p>
                    <p className="text-[#b3af9b] text-sm truncate">{customer?.email || customer?.phone}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  type="button"
                  className="shrink-0 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#b3af9b] hover:bg-black/5 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log out</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2 py-4">
                {[
                  { id: 'account', label: 'Account', icon: User },
                  { id: 'payment', label: 'Payment', icon: CreditCard },
                  { id: 'addresses', label: 'Addresses', icon: Home },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'orders', label: 'My Orders', icon: Package }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveSection(id)}
                    className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      activeSection === id
                        ? 'text-[#0b0f05] font-semibold bg-surface-card shadow-sm border border-[#b3af9b]'
                        : 'text-[#b3af9b] hover:bg-black/5'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1 min-w-0 overflow-y-auto pt-1">
                <div className="flex flex-col gap-6 p-6 sm:p-8">{renderSectionContent()}</div>
              </div>
            </>
          ) : (
            <>
              <aside className="flex-shrink-0 lg:w-64">
                <div
                  className="flex h-full flex-col justify-between rounded-xl p-4 shadow-sm"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex flex-col gap-4">
                    <div
                      className="flex items-center gap-3 pb-4 border-b"
                      style={{ borderColor: 'var(--color-outline)' }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary">
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
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveSection('account')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          activeSection === 'account'
                            ? 'text-primary font-semibold bg-surface-card shadow-sm border border-[#b3af9b]'
                            : 'text-text-light/70 dark:text-text-dark/70 hover:bg-black/5 hover:text-primary'
                        }`}
                      >
                        <User className="h-5 w-5" />
                        <p className="text-sm font-semibold leading-normal">Account</p>
                      </button>
                      <button
                        onClick={() => setActiveSection('payment')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          activeSection === 'payment'
                            ? 'text-primary font-semibold bg-surface-card shadow-sm border border-[#b3af9b]'
                            : 'text-text-light/70 dark:text-text-dark/70 hover:bg-black/5 hover:text-primary'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        <p className="text-sm font-medium leading-normal">Payment Methods</p>
                      </button>
                      <button
                        onClick={() => setActiveSection('addresses')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          activeSection === 'addresses'
                            ? 'text-primary font-semibold bg-surface-card shadow-sm border border-[#b3af9b]'
                            : 'text-text-light/70 dark:text-text-dark/70 hover:bg-black/5 hover:text-primary'
                        }`}
                      >
                        <Home className="h-5 w-5" />
                        <p className="text-sm font-medium leading-normal">Delivery Addresses</p>
                      </button>
                      <button
                        onClick={() => setActiveSection('notifications')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          activeSection === 'notifications'
                            ? 'text-primary font-semibold bg-surface-card shadow-sm border border-[#b3af9b]'
                            : 'text-text-light/70 dark:text-text-dark/70 hover:bg-black/5 hover:text-primary'
                        }`}
                      >
                        <Bell className="h-5 w-5" />
                        <p className="text-sm font-medium leading-normal">Notifications</p>
                      </button>
                      <button
                        onClick={() => setActiveSection('orders')}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          activeSection === 'orders'
                            ? 'text-primary font-semibold bg-surface-card shadow-sm border border-[#b3af9b]'
                            : 'text-text-light/70 dark:text-text-dark/70 hover:bg-black/5 hover:text-primary'
                        }`}
                      >
                        <Package className="h-5 w-5" />
                        <p className="text-sm font-medium leading-normal">My Orders</p>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 pt-8">
                    <button
                      onClick={onLogout}
                      className="flex items-center justify-center gap-2 rounded-lg h-11 px-4 text-primary text-sm font-bold leading-normal hover:bg-black/5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </aside>
              <div
                className="flex-1 min-w-0 rounded-xl shadow-sm overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <div className="flex flex-col gap-8 p-6 md:p-8">{renderSectionContent()}</div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerProfile;
