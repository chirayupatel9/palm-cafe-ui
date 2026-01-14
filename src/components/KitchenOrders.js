import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Printer, RefreshCw, AlertTriangle, Coffee, Utensils, ChevronDown, ChevronUp, ShoppingCart, Plus, Edit, Save, X, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useCurrency } from '../contexts/CurrencyContext';
import useOrders from '../hooks/useOrders';
import PrintModal from './PrintModal';

const KitchenOrders = ({ cart, setCart }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isDarkMode } = useDarkMode();
  const { cafeSettings } = useCafeSettings();
  const { formatCurrency } = useCurrency();
  
  // Use the custom orders hook with auto-refresh and WebSocket
  const { 
    orders, 
    loading, 
    isConnected,
    fetchOrders, 
    updateOrderInCache, 
    addOrderToCache, 
    removeOrderFromCache 
  } = useOrders(true, 30000, true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('today');
  const [todaySubTab, setTodaySubTab] = useState('active'); // 'active' for pending/preparing, 'completed' for completed
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHistoryCards, setExpandedHistoryCards] = useState(new Set());

  // Pagination states
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [itemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Editing states
  const [editingOrder, setEditingOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchMenuItems();
    }
  }, [isAuthenticated, authLoading]);

  // Update displayed orders when orders or filters change
  useEffect(() => {
    const filteredOrders = orders.filter(order => {
      // First filter by tab (today vs history vs cancelled)
      if (activeTab === 'today') {
        if (!isToday(order.created_at)) return false;
        
        // Then filter by today's sub-tab
        if (todaySubTab === 'active') {
          // Show only pending and preparing orders
          if (!['pending', 'preparing'].includes(order.status)) return false;
        } else if (todaySubTab === 'completed') {
          // Show only completed orders
          if (order.status !== 'completed') return false;
        }
      } else if (activeTab === 'history') {
        if (isToday(order.created_at) || order.status === 'cancelled') return false;
      } else if (activeTab === 'cancelled') {
        if (order.status !== 'cancelled') return false;
      }

      // Then filter by status (only for today and history tabs)
      if (activeTab === 'cancelled') return true; // Show all cancelled orders regardless of status filter
      if (filterStatus !== 'all') {
        if (activeTab === 'today' && todaySubTab === 'active') {
          // For today's active tab, only show pending and preparing
          if (!['pending', 'preparing'].includes(order.status)) return false;
        } else if (activeTab === 'today' && todaySubTab === 'completed') {
          // For today's completed tab, only show completed
          if (order.status !== 'completed') return false;
        } else {
          // For other tabs, use the filterStatus
          if (order.status !== filterStatus) return false;
        }
      }

      // Finally filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const orderNumber = order.order_number?.toString().toLowerCase() || '';
        const customerName = order.customer_name?.toLowerCase() || '';
        const customerPhone = order.customer_phone?.toLowerCase() || '';
        const customerEmail = order.customer_email?.toLowerCase() || '';
        const tableNumber = order.table_number?.toLowerCase() || '';
        const notes = order.notes?.toLowerCase() || '';
        
        // Check if any item names match the search
        const itemNames = order.items?.map(item => item.name?.toLowerCase() || '').join(' ') || '';
        
        if (!orderNumber.includes(query) && 
            !customerName.includes(query) && 
            !customerPhone.includes(query) && 
            !customerEmail.includes(query) && 
            !tableNumber.includes(query) &&
            !notes.includes(query) && 
            !itemNames.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Sort by created_at (newest first)
    const sortedOrders = filteredOrders.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    // Show first 10 items initially
    const initialDisplay = sortedOrders.slice(0, itemsPerPage);
    setDisplayedOrders(initialDisplay);
    setCurrentPage(1);
    setHasMore(sortedOrders.length > itemsPerPage);
  }, [orders, filterStatus, activeTab, todaySubTab, searchQuery, itemsPerPage]);


  const fetchMenuItems = async () => {
    try {
      const response = await axios.get('/menu');
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    }
  };

  const startEditing = (order) => {
    setEditingOrder(order.id);
    setEditFormData({
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      customer_phone: order.customer_phone || '',
      table_number: order.table_number || '',
      payment_method: order.payment_method || '',
      split_payment: order.split_payment || false,
      split_payment_method: order.split_payment_method || '',
      split_amount: order.split_amount || 0,
      extra_charge: order.extra_charge || 0,
      extra_charge_note: order.extra_charge_note || '',
      notes: order.notes || '',
      items: order.items ? [...order.items] : []
    });
  };

  const cancelEditing = () => {
    setEditingOrder(null);
    setEditFormData({});
  };

  const saveOrder = async () => {
    try {
      // Calculate totals
      const totalAmount = editFormData.items.reduce((sum, item) => sum + (item.total || 0), 0);
      const taxAmount = totalAmount * 0.085; // 8.5% tax
      const finalAmount = totalAmount + taxAmount + (editFormData.extra_charge || 0);

      const orderData = {
        ...editFormData,
        total_amount: totalAmount,
        tax_amount: taxAmount,
        final_amount: finalAmount
      };

      await axios.put(`/orders/${editingOrder}`, orderData);
      toast.success('Order updated successfully');
      
      // Update order in cache instead of refetching
      updateOrderInCache(editingOrder, { ...editFormData, status: 'preparing' });
      cancelEditing();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const updateEditFormData = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addItemToOrder = () => {
    if (menuItems.length === 0) {
      toast.error('No menu items available');
      return;
    }

    const newItem = {
      id: Date.now(), // Temporary ID for frontend
      menu_item_id: menuItems[0].id,
      name: menuItems[0].name,
      quantity: 1,
      price: menuItems[0].price,
      total: menuItems[0].price
    };

    setEditFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateOrderItem = (index, field, value) => {
    setEditFormData(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };

      // Recalculate total for this item
      if (field === 'quantity' || field === 'price') {
        const quantity = field === 'quantity' ? value : newItems[index].quantity;
        const price = field === 'price' ? value : newItems[index].price;
        newItems[index].total = quantity * price;
      }

      // Update item name if menu_item_id changes
      if (field === 'menu_item_id') {
        const selectedMenuItem = menuItems.find(item => item.id === parseInt(value));
        if (selectedMenuItem) {
          newItems[index].name = selectedMenuItem.name;
          newItems[index].price = selectedMenuItem.price;
          newItems[index].total = newItems[index].quantity * selectedMenuItem.price;
        }
      }

      return {
        ...prev,
        items: newItems
      };
    });
  };

  const removeOrderItem = (index) => {
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order ${status} successfully`);
      
      // Update order status in cache
      updateOrderInCache(orderId, { status });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const printOrder = async (order) => {
    setSelectedOrder(order);
    setShowPrintModal(true);
  };



  const addOrderToCart = (order) => {
    try {
      // Ensure setCart is a function
      if (typeof setCart !== 'function') {
        console.error('setCart is not a function:', setCart);
        toast.error('Cart functionality not available');
        return;
      }
      
      // Ensure cart is initialized as an array
      if (!cart || !Array.isArray(cart)) {
        setCart([]);
        return;
      }

      // Add all items from the order to cart
      order.items.forEach(item => {
        const cartItem = {
          id: item.menu_item_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        };
        
        // Check if item already exists in cart
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.menu_item_id);
        
        if (existingItemIndex !== -1) {
          // Update quantity of existing item
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].quantity += item.quantity;
          setCart(updatedCart);
        } else {
          // Add new item to cart
          setCart(prevCart => [...prevCart, cartItem]);
        }
      });
      
      toast.success(`Items from Order #${order.order_number} added to cart!`);
    } catch (error) {
      console.error('Error adding order to cart:', error);
      toast.error('Failed to add order to cart');
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
    if (isDarkMode) {
      switch (status) {
        case 'pending':
          return 'bg-yellow-900 text-yellow-300 border-yellow-700';
        case 'preparing':
          return 'bg-blue-900 text-blue-300 border-blue-700';
        case 'ready':
          return 'bg-green-900 text-green-300 border-green-700';
        case 'completed':
          return 'bg-green-800 text-green-200 border-green-600';
        case 'cancelled':
          return 'bg-red-900 text-red-300 border-red-700';
        default:
          return 'bg-gray-700 text-gray-300 border-gray-600';
      }
    } else {
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
  const getFilteredOrders = () => {
    return orders.filter(order => {
      // First filter by tab (today vs history vs cancelled)
      if (activeTab === 'today') {
        if (!isToday(order.created_at)) return false;
        
        // Then filter by today's sub-tab
        if (todaySubTab === 'active') {
          // Show only pending and preparing orders
          if (!['pending', 'preparing'].includes(order.status)) return false;
        } else if (todaySubTab === 'completed') {
          // Show only completed orders
          if (order.status !== 'completed') return false;
        }
      } else if (activeTab === 'history') {
        if (isToday(order.created_at) || order.status === 'cancelled') return false;
      } else if (activeTab === 'cancelled') {
        if (order.status !== 'cancelled') return false;
      }

      // Then filter by status (only for today and history tabs)
      if (activeTab === 'cancelled') return true; // Show all cancelled orders regardless of status filter
      if (filterStatus !== 'all') {
        if (activeTab === 'today' && todaySubTab === 'active') {
          // For today's active tab, only show pending and preparing
          if (!['pending', 'preparing'].includes(order.status)) return false;
        } else if (activeTab === 'today' && todaySubTab === 'completed') {
          // For today's completed tab, only show completed
          if (order.status !== 'completed') return false;
        } else {
          // For other tabs, use the filterStatus
          if (order.status !== filterStatus) return false;
        }
      }

      // Finally filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const orderNumber = order.order_number?.toString().toLowerCase() || '';
        const customerName = order.customer_name?.toLowerCase() || '';
        const customerPhone = order.customer_phone?.toLowerCase() || '';
        const customerEmail = order.customer_email?.toLowerCase() || '';
        const tableNumber = order.table_number?.toLowerCase() || '';
        const notes = order.notes?.toLowerCase() || '';
        
        // Check if any item names match the search
        const itemNames = order.items?.map(item => item.name?.toLowerCase() || '').join(' ') || '';
        
        if (!orderNumber.includes(query) && 
            !customerName.includes(query) && 
            !customerPhone.includes(query) && 
            !customerEmail.includes(query) && 
            !tableNumber.includes(query) &&
            !notes.includes(query) && 
            !itemNames.includes(query)) {
          return false;
        }
      }

      return true;
    });
  };

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

  const handleShowMore = () => {
    const filteredOrders = getFilteredOrders();

    const sortedOrders = filteredOrders.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    const nextPage = currentPage + 1;
    const nextItems = sortedOrders.slice(0, nextPage * itemsPerPage);
    
    setDisplayedOrders(nextItems);
    setCurrentPage(nextPage);
    setHasMore(nextItems.length < sortedOrders.length);
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
          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isConnected ? 'Live Updates' : 'Offline'}
            </span>
          </div>
          
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
                 const response = await axios.post('/orders/test');
                 toast.success('Test order created!');
                 // Add new order to cache
                 addOrderToCache(response.data);
               } catch (error) {
                 console.error('Error creating test order:', error);
                 toast.error('Failed to create test order');
               }
             }}
             className="btn-primary flex items-center"
             title="Create Test Order"
           >
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
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900' : 'bg-yellow-100'}`}>
              <Clock className={`h-6 w-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTab === 'today' && todaySubTab === 'active' ? 'Pending' : 'Pending'}
              </p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {todayOrders.filter(o => o.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <Utensils className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTab === 'today' && todaySubTab === 'active' ? 'Preparing' : 'Preparing'}
              </p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {todayOrders.filter(o => o.status === 'preparing').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900' : 'bg-green-100'}`}>
              <CheckCircle className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTab === 'today' && todaySubTab === 'completed' ? 'Completed' : 'Ready'}
              </p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {activeTab === 'today' && todaySubTab === 'completed' 
                  ? todayOrders.filter(o => o.status === 'completed').length
                  : todayOrders.filter(o => o.status === 'ready').length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 rounded-lg transition-surface" style={{ backgroundColor: 'var(--surface-table)' }}>
              <Coffee className="h-6 w-6" style={{ color: 'var(--color-on-surface-variant)' }} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>
                {activeTab === 'today' && todaySubTab === 'active' ? 'Total Active' : 
                 activeTab === 'today' && todaySubTab === 'completed' ? 'Total Completed' : 'Total Active'}
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {activeTab === 'today' && todaySubTab === 'active' 
                  ? pendingOrders.length
                  : activeTab === 'today' && todaySubTab === 'completed'
                  ? todayOrders.filter(o => o.status === 'completed').length
                  : pendingOrders.length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('today');
              setTodaySubTab('active'); // Reset to active sub-tab
              setFilterStatus('all'); // Reset filter
              setSearchQuery(''); // Clear search
              setCurrentPage(1); // Reset pagination when tab changes
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'today'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Today's Orders ({todayOrders.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setFilterStatus('all'); // Reset filter
              setSearchQuery(''); // Clear search
              setCurrentPage(1); // Reset pagination when tab changes
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            History ({historyOrders.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('cancelled');
              setFilterStatus('all'); // Reset filter
              setSearchQuery(''); // Clear search
              setCurrentPage(1); // Reset pagination when tab changes
            }}
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

      {/* Today's Orders Sub-tabs */}
      {activeTab === 'today' && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setTodaySubTab('active');
                setFilterStatus('all'); // Reset filter when switching sub-tabs
                setSearchQuery(''); // Clear search when switching sub-tabs
                setCurrentPage(1); // Reset pagination when sub-tab changes
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                todaySubTab === 'active'
                  ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Pending & Preparing ({todayOrders.filter(o => ['pending', 'preparing'].includes(o.status)).length})
            </button>
            <button
              onClick={() => {
                setTodaySubTab('completed');
                setFilterStatus('all'); // Reset filter when switching sub-tabs
                setSearchQuery(''); // Clear search when switching sub-tabs
                setCurrentPage(1); // Reset pagination when sub-tab changes
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                todaySubTab === 'completed'
                  ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Completed ({todayOrders.filter(o => o.status === 'completed').length})
            </button>
          </nav>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {activeTab !== 'cancelled' && (
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1); // Reset pagination when filter changes
              }}
              className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100' 
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            >
              <option value="all">All Orders</option>
              {activeTab === 'today' && todaySubTab === 'active' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                </>
              ) : activeTab === 'today' && todaySubTab === 'completed' ? (
                <option value="completed">Completed</option>
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>
          )}
          
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset pagination when search changes
              }}
              className={`px-3 py-2 pl-10 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 w-64 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {activeTab === 'today' && todaySubTab === 'active' && (
            <span>Showing pending & preparing orders ({displayedOrders.length} of {getFilteredOrders().length})</span>
          )}
          {activeTab === 'today' && todaySubTab === 'completed' && (
            <span>Showing completed orders ({displayedOrders.length} of {getFilteredOrders().length})</span>
          )}
          {activeTab === 'history' && (
            <span>Showing historical orders ({displayedOrders.length} of {getFilteredOrders().length})</span>
          )}
          {activeTab === 'cancelled' && (
            <span>Showing cancelled orders ({displayedOrders.length} of {getFilteredOrders().length})</span>
          )}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="text-center py-12">
          <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No orders found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Orders will appear here as they come in. New orders will show up automatically.</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedOrders.map((order) => {
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
                {editingOrder === order.id ? (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.customer_name || ''}
                        onChange={(e) => updateEditFormData('customer_name', e.target.value)}
                        className="input-field w-full"
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={editFormData.customer_phone || ''}
                        onChange={(e) => updateEditFormData('customer_phone', e.target.value)}
                        className="input-field w-full"
                        placeholder="Phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editFormData.customer_email || ''}
                        onChange={(e) => updateEditFormData('customer_email', e.target.value)}
                        className="input-field w-full"
                        placeholder="Email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Table Number
                      </label>
                      <input
                        type="text"
                        value={editFormData.table_number || ''}
                        onChange={(e) => updateEditFormData('table_number', e.target.value)}
                        className="input-field w-full"
                        placeholder="Table number/character"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={editFormData.payment_method || ''}
                        onChange={(e) => updateEditFormData('payment_method', e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editFormData.split_payment || false}
                        onChange={(e) => updateEditFormData('split_payment', e.target.checked)}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Split Payment
                      </label>
                    </div>
                    {editFormData.split_payment && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Split Payment Method
                          </label>
                          <select
                            value={editFormData.split_payment_method || ''}
                            onChange={(e) => updateEditFormData('split_payment_method', e.target.value)}
                            className="input-field w-full"
                          >
                            <option value="">Select split payment method</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                            <option value="online">Online</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Split Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.split_amount || 0}
                            onChange={(e) => updateEditFormData('split_amount', parseFloat(e.target.value) || 0)}
                            className="input-field w-full"
                            placeholder="Split amount"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Extra Charge
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.extra_charge || 0}
                        onChange={(e) => updateEditFormData('extra_charge', parseFloat(e.target.value) || 0)}
                        className="input-field w-full"
                        placeholder="Extra charge amount"
                      />
                    </div>
                    {editFormData.extra_charge > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Extra Charge Note
                        </label>
                        <input
                          type="text"
                          value={editFormData.extra_charge_note || ''}
                          onChange={(e) => updateEditFormData('extra_charge_note', e.target.value)}
                          className="input-field w-full"
                          placeholder="Reason for extra charge"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={editFormData.notes || ''}
                        onChange={(e) => updateEditFormData('notes', e.target.value)}
                        className="input-field w-full"
                        rows="2"
                        placeholder="Order notes"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {order.customer_name || 'Walk-in Customer'}
                    </p>
                    {(user?.role === 'admin' || (user?.role === 'chef' && cafeSettings?.chef_can_view_customers) || (user?.role === 'reception' && cafeSettings?.reception_can_view_customers)) && order.customer_phone && order.customer_phone.trim() !== '' && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📞 {order.customer_phone}
                      </p>
                    )}
                    {order.table_number && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        🍽️ Table: {order.table_number}
                      </p>
                    )}
                    {(user?.role === 'admin' || (user?.role === 'chef' && cafeSettings?.chef_can_view_payments) || (user?.role === 'reception' && cafeSettings?.reception_can_view_payments)) && order.payment_method && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        💳 {order.payment_method.toUpperCase()}
                      </p>
                    )}
                    {(user?.role === 'admin' || (user?.role === 'chef' && cafeSettings?.chef_can_view_payments) || (user?.role === 'reception' && cafeSettings?.reception_can_view_payments)) && order.split_payment && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                          Split Payment
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {formatCurrency(order.split_amount)} via {order.split_payment_method?.toUpperCase() || 'SPLIT'}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {formatCurrency(order.final_amount - order.split_amount)} via {order.payment_method?.toUpperCase() || 'PRIMARY'}
                        </p>
                      </div>
                    )}
                    {(user?.role === 'admin' || (user?.role === 'chef' && cafeSettings?.chef_can_view_payments) || (user?.role === 'reception' && cafeSettings?.reception_can_view_payments)) && order.extra_charge > 0 && (
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
                )}

                    {/* Order Items */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Items:</h4>
                        {editingOrder === order.id && (
                          <button
                            onClick={addItemToOrder}
                            className="text-sm px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Item
                          </button>
                        )}
                      </div>
                      {editingOrder === order.id ? (
                        <div className="space-y-3">
                          {editFormData.items && editFormData.items.length > 0 ? (
                            editFormData.items.map((item, index) => (
                              <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Item {index + 1}
                                  </span>
                                  <button
                                    onClick={() => removeOrderItem(index)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      Menu Item
                                    </label>
                                    <select
                                      value={item.menu_item_id || ''}
                                      onChange={(e) => updateOrderItem(index, 'menu_item_id', e.target.value)}
                                      className="input-field text-sm"
                                    >
                                      {menuItems.map(menuItem => (
                                        <option key={menuItem.id} value={menuItem.id}>
                                          {menuItem.name} - {formatCurrency(menuItem.price)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      Quantity
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity || 1}
                                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                      className="input-field text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      Unit Price
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.price || 0}
                                      onChange={(e) => updateOrderItem(index, 'price', parseFloat(e.target.value) || 0)}
                                      className="input-field text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      Total
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={item.total || 0}
                                      readOnly
                                      className="input-field text-sm bg-gray-100 dark:bg-gray-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                              No items added
                            </p>
                          )}
                        </div>
                      ) : (
                        order.items && order.items.length > 0 ? (
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
                                  {formatCurrency(item.price || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No items found
                          </p>
                        )
                      )}
                    </div>

                    {/* Order Total */}
                    <div className="border-t pt-3 mb-4">
                      {editingOrder === order.id ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              ₹{editFormData.items ? editFormData.items.reduce((sum, item) => sum + (item.total || 0), 0).toFixed(2) : '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Tax (8.5%):</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              ₹{((editFormData.items ? editFormData.items.reduce((sum, item) => sum + (item.total || 0), 0) : 0) * 0.085).toFixed(2)}
                            </span>
                          </div>
                          {editFormData.extra_charge > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Extra Charge:</span>
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                ₹{editFormData.extra_charge.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center border-t pt-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">Final Total:</span>
                            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                              ₹{((editFormData.items ? editFormData.items.reduce((sum, item) => sum + (item.total || 0), 0) : 0) * 1.085 + (editFormData.extra_charge || 0)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Total:</span>
                          <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            ₹{order.final_amount}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {editingOrder === order.id ? (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                          Notes:
                        </label>
                        <textarea
                          value={editFormData.notes || ''}
                          onChange={(e) => updateEditFormData('notes', e.target.value)}
                          className="input-field w-full text-sm"
                          rows="2"
                          placeholder="Order notes"
                        />
                      </div>
                    ) : (
                      order.notes && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>Notes:</strong> {order.notes}
                          </p>
                        </div>
                      )
                    )}
                  </>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex space-x-2">
                    {editingOrder === order.id ? (
                      // Editing mode actions
                      <div className="flex space-x-2">
                        <button
                          onClick={saveOrder}
                          className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      // Normal mode actions
                      <>
                        {/* Show update buttons for today's orders and for admin/chef in history/cancelled tabs */}
                        {(activeTab === 'today' || (user?.role === 'admin' || user?.role === 'chef')) && (
                          <div className="flex flex-wrap gap-1">
                            {getStatusOptions(order.status).map((status) => (
                              <button
                                key={status}
                                onClick={() => updateOrderStatus(order.id, status)}
                                className={`text-xs px-2 py-1 rounded border ${
                                  status === 'cancelled' 
                                    ? isDarkMode 
                                      ? 'text-red-400 border-red-600 hover:bg-red-900' 
                                      : 'text-red-600 border-red-300 hover:bg-red-50'
                                    : status === 'completed'
                                    ? isDarkMode
                                      ? 'text-green-400 border-green-600 hover:bg-green-900'
                                      : 'text-green-600 border-green-300 hover:bg-green-50'
                                    : isDarkMode
                                      ? 'text-blue-400 border-blue-600 hover:bg-blue-900'
                                      : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                                }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingOrder !== order.id && (
                      <>
                        {(user?.role === 'admin' || (user?.role === 'chef' && cafeSettings?.chef_can_edit_orders) || (user?.role === 'reception' && cafeSettings?.reception_can_edit_orders)) && (
                          <button
                            onClick={() => startEditing(order)}
                            className={`text-sm px-3 py-1 rounded border flex items-center ${
                              isDarkMode 
                                ? 'text-blue-400 border-blue-600 hover:bg-blue-900' 
                                : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                            }`}
                            title="Edit Order"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => addOrderToCart(order)}
                          className={`text-sm px-3 py-1 rounded border flex items-center ${
                            isDarkMode 
                              ? 'text-green-400 border-green-600 hover:bg-green-900' 
                              : 'text-green-600 border-green-300 hover:bg-green-50'
                          }`}
                          title="Add to Cart"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => printOrder(order)}
                          className="btn-secondary text-sm px-3 py-1"
                          title="Print Order"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Show More Button */}
          {hasMore && displayedOrders.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={handleShowMore}
                className="btn-secondary flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Show More ({currentPage * itemsPerPage} of {getFilteredOrders().length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Print Modal */}
      <PrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        order={selectedOrder}
        onPrintSuccess={() => {
          setShowPrintModal(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
};

export default KitchenOrders; 