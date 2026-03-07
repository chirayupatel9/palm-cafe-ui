import React, { useState, useEffect } from 'react';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { getImageUrl } from '../utils/imageUtils';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  Gift,
  TrendingUp,
  UserCheck,
  UserX
} from 'lucide-react';
import PageHeader from './PageHeader';
import { TableSkeleton } from './ui/Skeleton';
import Select from './ui/Select';
import { EmptyCustomers } from './ui/EmptyState';
import Dialog from './ui/Dialog';
import { GlassButton } from './ui/GlassButton';

const CustomerManagement: React.FC = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isDarkMode } = useDarkMode();
  const { cafeSettings } = useCafeSettings();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [filterActive, setFilterActive] = useState('all');
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    address: string;
    date_of_birth: string;
    notes: string;
    is_active?: boolean;
  }>({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    notes: ''
  });

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchCustomers();
      fetchStatistics();
    }
  }, [isAuthenticated, authLoading]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/customers/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const searchCustomers = async (query) => {
    if (!query.trim()) {
      fetchCustomers();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/customers/search/${encodeURIComponent(query)}`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error searching customers:', error);
      toast.error('Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async (customerId) => {
    try {
      const response = await axios.get(`/customers/${customerId}/orders`);
      setOrderHistory(response.data);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
    }
  };

  const viewOrderDetails = async (order) => {
    try {
      if (!order.order_number) {
        toast.error('No order details available');
        return;
      }
      
      const response = await axios.get(`/orders?order_number=${order.order_number}`);
      const orders = response.data;
      
      if (!orders || orders.length === 0) {
        toast.error('Order not found');
        return;
      }
      
      const orderDetails = orders[0];
      setSelectedOrder({ ...order, orderDetails: orderDetails });
      setShowOrderDetailsModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (showEditModal) {
        await axios.put(`/customers/${selectedCustomer.id}`, formData);
        toast.success('Changes saved');
      } else {
        await axios.post('/customers', formData);
        toast.success('Customer added');
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({ name: '', email: '', phone: '', address: '', date_of_birth: '', notes: '' });
      fetchCustomers();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(error.response?.data?.error || 'We couldn\'t save your changes. Please try again.');
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      date_of_birth: customer.date_of_birth ? customer.date_of_birth.split('T')[0] : '',
      notes: customer.notes || ''
    });
    setShowEditModal(true);
  };

  const handleViewOrders = async (customer) => {
    setSelectedCustomer(customer);
    await fetchOrderHistory(customer.id);
    setShowOrderHistoryModal(true);
  };

  const handleRedeemPoints = async (customerId, points) => {
    try {
      await axios.post(`/customers/${customerId}/redeem-points`, { points });
      toast.success('Points redeemed');
      fetchCustomers();
      fetchStatistics();
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast.error(error.response?.data?.error || 'We couldn\'t redeem the points. Please check the amount and try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (isActive) => {
    return isActive ? <UserCheck className="h-4 w-4 text-green-500" /> : <UserX className="h-4 w-4 text-red-500" />;
  };

  const filteredCustomers = customers.filter(customer => {
    if (filterActive === 'active') return customer.is_active;
    if (filterActive === 'inactive') return !customer.is_active;
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <img 
          src={cafeSettings.logo_url ? getImageUrl(cafeSettings.logo_url) : getImageUrl('/images/palm-cafe-logo.png')} 
          alt={`${cafeSettings.cafe_name || 'Cafe'} Logo`} 
          className="h-16 w-16 mb-4 opacity-50"
        />
        <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-2">Authentication Required</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          You need to be logged in to access customer management.
        </p>
        <GlassButton
          onClick={() => window.location.href = '/login'}
          size="default"
          className="glass-button-primary"
        >
          Go to Login
        </GlassButton>
      </div>
    );
  }

  if (loading && customers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Loading customers..."
        />
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-outline)]/30">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Loyalty</th>
                  <th className="px-6 py-3.5">Visits</th>
                  <th className="px-6 py-3.5">Total Spent</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <TableSkeleton rows={5} columns={7} />
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Users"
        description={`Manage customers and loyalty program. Total: ${customers.length}`}
        icon={Users}
        primaryAction={() => setShowAddModal(true)}
        primaryActionLabel="Add Customer"
        primaryActionIcon={Plus}
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5">
            <div className="flex items-center">
              <div className="p-2 rounded-lg">
                <Users className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-body-muted">Total Customers</p>
                <p className="text-2xl font-bold text-on-surface">{statistics.totalCustomers}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center">
              <div className="p-2 rounded-lg">
                <UserCheck className="h-6 w-6" style={{ color: 'var(--color-success)' }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-body-muted">Active Customers</p>
                <p className="text-2xl font-bold text-on-surface">{statistics.activeCustomers}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center">
              <div className="p-2 rounded-lg">
                <Star className="h-6 w-6" style={{ color: 'var(--color-warning)' }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-body-muted">Total Points</p>
                <p className="text-2xl font-bold text-on-surface">{statistics.totalLoyaltyPoints}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center">
              <div className="p-2 rounded-lg">
                <TrendingUp className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-body-muted">Total Spent</p>
                <p className="text-2xl font-bold text-on-surface">{formatCurrency(statistics.totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-2xl w-full relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
          <div className="flex-1 min-w-0 relative flex items-center">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none text-[var(--color-on-surface-variant)]" aria-hidden />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCustomers(searchQuery)}
              className="glass-input input-field pl-12 h-11 rounded-xl w-full border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <div className="w-full sm:w-[180px] [&_.select-trigger-glass-hover]:h-11 [&_.select-trigger-glass-hover]:rounded-xl">
              <Select
                options={[
                  { value: 'all', label: 'All Customers' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'inactive', label: 'Inactive Only' }
                ]}
                value={filterActive}
                onChange={setFilterActive}
                placeholder="All Customers"
                className="select-trigger-glass select-trigger-glass-hover w-full"
              />
            </div>
            <button
              type="button"
              onClick={() => searchCustomers(searchQuery)}
              className="h-11 px-5 rounded-xl shrink-0 font-medium text-[var(--color-on-surface)] border border-[var(--color-outline-variant)] bg-[var(--surface-card)] hover:bg-[var(--color-outline-variant)]/20 transition-colors select-trigger-glass select-trigger-glass-hover"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Customers List – same glass as Menu/Categories */}
      <div className="glass-card overflow-hidden rounded-2xl shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="p-6">
            <EmptyCustomers />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wider bg-[var(--surface-table)]/60 text-[var(--color-on-surface)]">
                  <th className="px-3 sm:px-6 py-3.5 rounded-tl-lg whitespace-nowrap">Customer</th>
                  <th className="px-3 sm:px-6 py-3.5 whitespace-nowrap">Contact</th>
                  <th className="px-3 sm:px-6 py-3.5 whitespace-nowrap">Loyalty</th>
                  <th className="px-3 sm:px-6 py-3.5 whitespace-nowrap">Visits</th>
                  <th className="px-3 sm:px-6 py-3.5 whitespace-nowrap">Total Spent</th>
                  <th className="px-3 sm:px-6 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3.5 text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-outline)]/30">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="h-14 transition-colors hover:bg-[var(--surface-table)]/50"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center transition-surface" style={{ 
                            backgroundColor: 'var(--color-primary-container)'
                          }}>
                            <span className="text-sm font-medium" style={{ 
                              color: 'var(--color-on-primary-container)'
                            }}>
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[var(--color-on-surface)]">{customer.name}</div>
                          <div className="text-sm text-[var(--color-on-surface-variant)]">
                            Member since {formatDate(customer.first_visit_date)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--color-on-surface)]">
                        {customer.phone && (
                          <div className="flex items-center mb-1">
                            <Phone className="h-3 w-3 mr-1 text-[var(--color-on-surface-variant)]" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-[var(--color-on-surface-variant)]" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium text-[var(--color-on-surface)]">
                          {customer.loyalty_points} pts
                        </span>
                      </div>
                      {customer.loyalty_points >= 100 && (
                        <GlassButton
                          onClick={() => handleRedeemPoints(customer.id, 100)}
                          size="sm"
                          className="glass-button-secondary mt-1"
                        >
                          Redeem 100 pts
                        </GlassButton>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">
                      {customer.visit_count} visits
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-on-surface)]">
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {getStatusIcon(customer.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        <GlassButton
                          onClick={() => handleViewOrders(customer)}
                          size="icon"
                          className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                          title="View Orders"
                        >
                          <Calendar className="h-4 w-4" />
                        </GlassButton>
                        <GlassButton
                          onClick={() => handleEdit(customer)}
                          size="icon"
                          className="glass-button-secondary [&_.glass-button]:!min-w-[36px] [&_.glass-button]:!h-9 [&_.glass-button-text]:!min-w-[36px] [&_.glass-button-text]:!h-9"
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </GlassButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Customer">
        <form onSubmit={handleSubmit} className="pt-0">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
                className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                placeholder="Street, city, state"
                className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm min-h-[80px] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] px-4 py-2.5 text-sm [color-scheme:inherit]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                placeholder="Optional notes"
                className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm min-h-[60px] resize-none"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
            <GlassButton
              type="button"
              onClick={() => setShowAddModal(false)}
              size="default"
              className="glass-button-secondary"
              contentClassName="flex items-center gap-2"
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" size="default" className="glass-button-primary" contentClassName="flex items-center gap-2">
              Add Customer
            </GlassButton>
          </div>
        </form>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog
        open={!!(showEditModal && selectedCustomer)}
        onClose={() => setShowEditModal(false)}
        title="Edit Customer"
      >
        {showEditModal && selectedCustomer && (
          <form onSubmit={handleSubmit} className="pt-0">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer name"
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  placeholder="Street, city, state"
                  className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm min-h-[80px] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="glass-input w-full min-h-[40px] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] px-4 py-2.5 text-sm [color-scheme:inherit]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes"
                  className="glass-input w-full rounded-xl border border-[var(--color-outline-variant)] bg-[var(--surface-card)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)] px-4 py-2.5 text-sm min-h-[60px] resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-[var(--color-outline)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                  <span className="text-sm text-[var(--color-on-surface)]">Active Customer</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
              <GlassButton
                type="button"
                onClick={() => setShowEditModal(false)}
                size="default"
                className="glass-button-secondary"
                contentClassName="flex items-center gap-2"
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" size="default" className="glass-button-primary" contentClassName="flex items-center gap-2">
                Update Customer
              </GlassButton>
            </div>
          </form>
        )}
      </Dialog>

      {/* Order History Modal - Template Dialog */}
      <Dialog
        open={!!(showOrderHistoryModal && selectedCustomer)}
        onClose={() => setShowOrderHistoryModal(false)}
        title={selectedCustomer ? `Order History - ${selectedCustomer.name}` : 'Order History'}
        size="4xl"
      >
        {showOrderHistoryModal && selectedCustomer && (
            <>
            {orderHistory.length === 0 ? (
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>This customer hasn't placed any orders yet. Orders will appear here once they make a purchase.</p>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <div
                    key={order.id}
                    className="glass-card p-4 rounded-xl cursor-pointer"
                    onClick={() => viewOrderDetails(order)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Order #{order.order_number}</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{formatCurrency(order.final_amount)}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} capitalize`}>{order.status}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{item.quantity}x {item.name}</span>
                          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-2 text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}>
                      Click to view details →
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
        )}
      </Dialog>

      {/* Order Details Modal - Template Dialog */}
      <Dialog
        open={!!(showOrderDetailsModal && selectedOrder)}
        onClose={() => setShowOrderDetailsModal(false)}
        title={selectedOrder ? `Order #${selectedOrder.order_number}` : 'Order Details'}
        size="2xl"
      >
        {showOrderDetailsModal && selectedOrder && (
            <>
              <p className="text-sm text-[#b3af9b] mb-4">{formatDate(selectedOrder.created_at)}</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer:</span>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedCustomer?.name}</p>
                  </div>
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status:</span>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} capitalize`}>{selectedOrder.status}</p>
                  </div>
                </div>

                {selectedOrder.orderDetails && (
                  <div>
                    <h4 className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Order Items:</h4>
                    <div className="space-y-2">
                      {selectedOrder.orderDetails.items.map((item, index) => (
                        <div key={index} className={`flex justify-between items-center py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div>
                            <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.name}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Qty: {item.quantity} × {formatCurrency(item.price)}
                            </p>
                          </div>
                          <p className={`font-medium ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`flex justify-between items-center pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Total Amount:</span>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>
                      {formatCurrency(selectedOrder.final_amount)}
                    </p>
                  </div>
                  <GlassButton
                    onClick={() => setShowOrderDetailsModal(false)}
                    size="default"
                    className="glass-button-secondary"
                  >
                    Close
                  </GlassButton>
                </div>
              </div>
            </>
        )}
      </Dialog>
    </div>
  );
};

export default CustomerManagement; 