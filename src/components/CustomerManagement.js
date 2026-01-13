import React, { useState, useEffect } from 'react';
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
import { EmptyCustomers } from './ui/EmptyState';

const CustomerManagement = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isDarkMode } = useDarkMode();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filterActive, setFilterActive] = useState('all');
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
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
        toast.success('Customer updated successfully');
      } else {
        await axios.post('/customers', formData);
        toast.success('Customer created successfully');
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setFormData({ name: '', email: '', phone: '', address: '', date_of_birth: '', notes: '' });
      fetchCustomers();
      fetchStatistics();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(error.response?.data?.error || 'Failed to save customer');
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
      toast.success('Points redeemed successfully');
      fetchCustomers();
      fetchStatistics();
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast.error(error.response?.data?.error || 'Failed to redeem points');
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
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-16 w-16 mb-4 opacity-50"
        />
        <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-2">Authentication Required</h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
          You need to be logged in to access customer management.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="btn-primary"
        >
          Go to Login
        </button>
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
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Loyalty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Total Spent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
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
        primaryAction={() => setShowAddModal(true)}
        primaryActionLabel="Add Customer"
        primaryActionIcon={Plus}
      />

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center">
              <Users className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Total Customers</p>
                <p className="text-2xl font-bold">{statistics.totalCustomers}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Active Customers</p>
                <p className="text-2xl font-bold">{statistics.activeCustomers}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center">
              <Star className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Total Points</p>
                <p className="text-2xl font-bold">{statistics.totalLoyaltyPoints}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-r from-[#6F4E37] to-[#8B6F47] text-white">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 mr-3" />
              <div>
                <p className="text-sm opacity-90">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCustomers(searchQuery)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-transparent ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-gray-100' 
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="all">All Customers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          
          <button
            onClick={() => searchCustomers(searchQuery)}
            className="btn-secondary"
          >
            Search
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="card">
        {filteredCustomers.length === 0 ? (
          <EmptyCustomers onAdd={() => setShowAddModal(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Customer
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Contact
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Loyalty
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Visits
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Total Spent
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className={`h-14 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-gray-700' : 'bg-secondary-100'
                          }`}>
                            <span className={`text-sm font-medium ${
                              isDarkMode ? 'text-gray-300' : 'text-secondary-700'
                            }`}>
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{customer.name}</div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Member since {formatDate(customer.first_visit_date)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {customer.phone && (
                          <div className="flex items-center mb-1">
                            <Phone className={`h-3 w-3 mr-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center">
                            <Mail className={`h-3 w-3 mr-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                          {customer.loyalty_points} pts
                        </span>
                      </div>
                      {customer.loyalty_points >= 100 && (
                        <button
                          onClick={() => handleRedeemPoints(customer.id, 100)}
                          className={`text-xs ${isDarkMode ? 'text-secondary-400 hover:text-secondary-300' : 'text-secondary-600 hover:text-secondary-800'}`}
                        >
                          Redeem 100 pts
                        </button>
                      )}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {customer.visit_count} visits
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {formatCurrency(customer.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(customer.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewOrders(customer)}
                          className={`${isDarkMode ? 'text-secondary-400 hover:text-secondary-300' : 'text-secondary-600 hover:text-secondary-900'}`}
                          title="View Orders"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                          title="Edit Customer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Add New Customer</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Edit Customer</h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows="3"
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="2"
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active !== false}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active Customer</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderHistoryModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Order History - {selectedCustomer.name}</h3>
              <button
                onClick={() => setShowOrderHistoryModal(false)}
                className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'dark:hover:text-gray-300' : ''}`}
              >
                ✕
              </button>
            </div>
            
            {orderHistory.length === 0 ? (
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>No orders found for this customer.</p>
            ) : (
              <div className="space-y-4">
                {orderHistory.map((order) => (
                  <div 
                    key={order.id} 
                    className={`border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4 cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                    }`}
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
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-secondary-300' : 'text-secondary-700'}`}>
                    Order #{selectedOrder.order_number}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderDetailsModal(false)}
                  className={`text-gray-400 hover:text-gray-600 ${isDarkMode ? 'dark:hover:text-gray-300' : ''}`}
                >
                  ✕
                </button>
              </div>

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
                  <button
                    onClick={() => setShowOrderDetailsModal(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                        : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement; 