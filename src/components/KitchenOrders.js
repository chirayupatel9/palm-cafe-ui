import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Printer, RefreshCw, AlertTriangle, Coffee, Utensils, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const KitchenOrders = () => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('today');
  const [expandedHistoryCards, setExpandedHistoryCards] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchOrders();
      if (autoRefresh) {
        const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
      }
    }
  }, [isAuthenticated, authLoading, autoRefresh]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      
      // Check for new pending orders (auto-print removed)
      const newOrders = response.data.filter(newOrder => 
        newOrder.status === 'pending' && 
        !orders.some(oldOrder => oldOrder.id === newOrder.id)
      );
      
      if (newOrders.length > 0) {
        toast.success(`${newOrders.length} new order(s) received!`);
      }
      
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status} successfully`);
      
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const printOrder = async (order) => {
    try {
      const response = await axios.post(`/orders/${order.id}/print`, {}, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `order-${order.order_number}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Order printed successfully');
    } catch (error) {
      console.error('Error printing order:', error);
      toast.error('Failed to print order');
    }
  };

  const reorderItems = async (order) => {
    try {
      // Create a new order with the same items
      const orderData = {
        customer_name: order.customer_name || 'Walk-in Customer',
        customer_phone: order.customer_phone || '',
        items: order.items.map(item => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          name: item.name
        })),
        notes: `Re-order from Order #${order.order_number}`,
        payment_method: order.payment_method || 'cash',
        pickup_option: order.pickup_option || 'pickup'
      };

      const response = await axios.post('/orders', orderData);
      toast.success(`Re-order created successfully! New Order #${response.data.order_number}`);
      
      // Refresh orders to show the new order
      fetchOrders();
    } catch (error) {
      console.error('Error creating re-order:', error);
      toast.error('Failed to create re-order');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'preparing':
        return <Utensils className="h-5 w-5 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-green-200 text-green-900 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'completed';
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateOnly = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (timestamp) => {
    const today = new Date();
    const orderDate = new Date(timestamp);
    return today.toDateString() === orderDate.toDateString();
  };

  const isYesterday = (timestamp) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const orderDate = new Date(timestamp);
    return yesterday.toDateString() === orderDate.toDateString();
  };

  // Filter orders based on active tab and status filter
  const filteredOrders = orders.filter(order => {
    // First filter by tab (today vs history vs cancelled)
    if (activeTab === 'today') {
      if (!isToday(order.created_at)) return false;
    } else if (activeTab === 'history') {
      if (isToday(order.created_at) || order.status === 'cancelled') return false;
    } else if (activeTab === 'cancelled') {
      if (order.status !== 'cancelled') return false;
    }

    // Then filter by status (only for today and history tabs)
    if (activeTab === 'cancelled') return true; // Show all cancelled orders regardless of status filter
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const pendingOrders = orders.filter(order => 
    ['pending', 'preparing'].includes(order.status) && isToday(order.created_at)
  );

  const todayOrders = orders.filter(order => isToday(order.created_at));
  const historyOrders = orders.filter(order => !isToday(order.created_at) && order.status !== 'cancelled');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  const toggleHistoryCard = (orderId) => {
    const newExpanded = new Set(expandedHistoryCards);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedHistoryCards(newExpanded);
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading kitchen orders...</p>
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
          You need to be logged in to access the kitchen orders.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/images/palm-cafe-logo.png" 
            alt="Palm Cafe Logo" 
            className="h-12 w-12 mr-4"
          />
          <div>
            <h1 className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">Kitchen Orders</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage and track order preparation</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchOrders}
            className="btn-secondary flex items-center"
            title="Refresh Orders"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={async () => {
              try {
                await axios.post('/orders/test');
                toast.success('Test order created!');
                fetchOrders();
              } catch (error) {
                console.error('Error creating test order:', error);
                toast.error('Failed to create test order');
              }
            }}
            className="btn-primary flex items-center"
            title="Create Test Order"
          >
            <Plus className="h-4 w-4 mr-2" />
            Test Order
          </button>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {todayOrders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Utensils className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Preparing</p>
              <p className="text-2xl font-bold text-blue-600">
                {todayOrders.filter(o => o.status === 'preparing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ready</p>
              <p className="text-2xl font-bold text-green-600">
                {todayOrders.filter(o => o.status === 'ready').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Coffee className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Active</p>
              <p className="text-2xl font-bold text-gray-600">
                {pendingOrders.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('today')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'today'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Today's Orders ({todayOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            History ({historyOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cancelled'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Cancelled ({cancelledOrders.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {activeTab !== 'cancelled' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {activeTab === 'today' && (
            <span>Showing today's orders ({filteredOrders.length})</span>
          )}
          {activeTab === 'history' && (
            <span>Showing historical orders ({filteredOrders.length})</span>
          )}
          {activeTab === 'cancelled' && (
            <span>Showing cancelled orders ({filteredOrders.length})</span>
          )}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const isHistoryCard = activeTab === 'history';
            const isCancelledCard = activeTab === 'cancelled';
            const isExpanded = expandedHistoryCards.has(order.id);
            
            return (
              <div
                key={order.id}
                className={`card border-l-4 ${
                  order.status === 'pending' ? 'border-l-yellow-500' :
                  order.status === 'preparing' ? 'border-l-blue-500' :
                  order.status === 'ready' ? 'border-l-green-500' :
                  order.status === 'completed' ? 'border-l-green-600' :
                  'border-l-red-500'
                }`}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Order #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeTab === 'history' ? formatDateOnly(order.created_at) : formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {(isHistoryCard || isCancelledCard) && (
                      <button
                        onClick={() => toggleHistoryCard(order.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Show full details only if not history/cancelled card or if card is expanded */}
                {(!isHistoryCard && !isCancelledCard || isExpanded) && (
                  <>
                    {/* Customer Info */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {order.customer_name || 'Walk-in Customer'}
                      </p>
                      {order.customer_phone && order.customer_phone.trim() !== '' && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📞 {order.customer_phone}
                        </p>
                      )}
                      {order.payment_method && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          💳 {order.payment_method.toUpperCase()}
                        </p>
                      )}
                      {order.split_payment && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                            Split Payment
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            ₹{order.split_amount} via {order.split_payment_method?.toUpperCase() || 'SPLIT'}
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            ₹{(order.final_amount - order.split_amount).toFixed(2)} via {order.payment_method?.toUpperCase() || 'PRIMARY'}
                          </p>
                        </div>
                      )}
                      {order.extra_charge > 0 && (
                        <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                          <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                            Extra Charge: ₹{order.extra_charge}
                          </p>
                          {order.extra_charge_note && (
                            <p className="text-xs text-orange-700 dark:text-orange-300">
                              Note: {order.extra_charge_note}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Items:</h4>
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.quantity}x
                                </span>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {item.name || 'Unknown Item'}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                ₹{item.price || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          No items found
                        </p>
                      )}
                    </div>

                    {/* Order Total */}
                    <div className="border-t pt-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-gray-100">Total:</span>
                        <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          ₹{order.final_amount}
                        </span>
                      </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Notes:</strong> {order.notes}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex space-x-2">
                    {/* Show update buttons for today's orders and for admin/chef in history/cancelled tabs */}
                    {(activeTab === 'today' || (user?.role === 'admin' || user?.role === 'chef')) && (
                      <div className="flex flex-wrap gap-1">
                        {getStatusOptions(order.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            className={`text-xs px-2 py-1 rounded border ${
                              status === 'cancelled' 
                                ? 'text-red-600 border-red-300 hover:bg-red-50' 
                                : status === 'completed'
                                ? 'text-green-600 border-green-300 hover:bg-green-50'
                                : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => reorderItems(order)}
                      className="btn-materialize text-sm px-3 py-1 flex items-center"
                      title="Re-order Items"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Re-order
                    </button>
                    <button
                      onClick={() => printOrder(order)}
                      className="btn-secondary text-sm px-3 py-1"
                      title="Print Order"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KitchenOrders; 