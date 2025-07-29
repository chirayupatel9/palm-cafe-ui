import React, { useState, useEffect } from 'react';
import { Clock, Package, CheckCircle, XCircle, Calendar, Receipt, Star, Menu, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';

const CustomerOrderHistory = ({ customerPhone, setActiveTab, cart, setCart }) => {
  const { formatCurrency } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);

  useEffect(() => {
    if (customerPhone) {
      fetchOrderHistory();
      fetchCustomerInfo();
    }
  }, [customerPhone]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/customer/orders?customer_phone=${customerPhone}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerInfo = async () => {
    try {
      const response = await axios.get(`/customer/login/${customerPhone}`);
      if (response.data) {
        setCustomerInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching customer info:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'preparing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate points earned for an order (1 point per 10 currency units)
  const calculatePointsEarned = (orderAmount) => {
    return Math.floor(orderAmount / 10);
  };

  const downloadInvoice = async (orderNumber) => {
    try {
      // First, get the invoice number for this order
      const invoiceResponse = await axios.get(`/invoices/order/${orderNumber}`);
      const invoice = invoiceResponse.data;
      
      if (!invoice || !invoice.invoice_number) {
        toast.error('No invoice found for this order');
        return;
      }
      
      // Now download the PDF using the invoice number
      const response = await axios.get(`/invoices/${invoice.invoice_number}/download`);
      
      // Create blob and open PDF in new tab
      const pdfBlob = new Blob([Uint8Array.from(atob(response.data.pdf), c => c.charCodeAt(0))], {
        type: 'application/pdf'
      });
      
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      
      // Clean up the URL object after a delay
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      if (error.response?.status === 404) {
        toast.error('No invoice found for this order');
      } else {
        toast.error('Failed to download invoice');
      }
    }
  };

  const addOrderToCart = (order) => {
    try {
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
      
      // Switch back to menu tab to show the cart
      setActiveTab('menu');
    } catch (error) {
      console.error('Error adding order to cart:', error);
      toast.error('Failed to add order to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
        <span className="ml-2 text-gray-600">Loading order history...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Orders Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start ordering to see your order history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customer Points Display */}
      {customerInfo && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Loyalty Points
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Total points earned from all orders
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                {customerInfo.loyalty_points || 0}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                points
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
          Order History
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('menu')}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
          >
            <Menu className="h-4 w-4" />
            <span>Back to Menu</span>
          </button>
          <button
            onClick={fetchOrderHistory}
            className="text-sm text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-accent-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Order Header */}
            <div className="p-4 border-b border-accent-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="font-semibold text-secondary-700 dark:text-secondary-300">
                      Order #{order.order_number}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(order.created_at)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-secondary-700 dark:text-secondary-300">
                    {formatCurrency(order.final_amount)}
                  </div>
                  <div className="flex items-center justify-end space-x-2 mt-1">
                    <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                      <Star className="h-3 w-3 mr-1" />
                      <span>+{calculatePointsEarned(order.final_amount)} pts</span>
                    </div>
                    <button
                      onClick={() => addOrderToCart(order)}
                                              className="btn-materialize text-xs px-2 py-1 flex items-center"
                        title="Add to Cart"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Cart
                    </button>
                    <button
                      onClick={() => downloadInvoice(order.order_number)}
                      className="text-xs text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
                    >
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="p-4">
              <div className="space-y-2">
                {order.items && order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.quantity}x
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t border-accent-200 dark:border-gray-700">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                      <span>{formatCurrency(order.tax_amount)}</span>
                    </div>
                  )}
                  {order.tip_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tip:</span>
                      <span>{formatCurrency(order.tip_amount)}</span>
                    </div>
                  )}
                  {order.points_redeemed > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Points Redeemed ({order.points_redeemed} pts):</span>
                      <span>-{formatCurrency(order.points_redeemed * 0.1)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-secondary-700 dark:text-secondary-300">
                    <span>Total:</span>
                    <span>{formatCurrency(order.final_amount)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                {order.payment_method && (
                  <div className="mt-3 pt-3 border-t border-accent-200 dark:border-gray-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                        {order.payment_method}
                      </span>
                    </div>
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
                )}

                {/* Points Earned */}
                <div className="mt-3 pt-3 border-t border-accent-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Points Earned:</span>
                    <div className="flex items-center text-yellow-600 dark:text-yellow-400 font-medium">
                      <Star className="h-3 w-3 mr-1" />
                      <span>+{calculatePointsEarned(order.final_amount)} points</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Points Balance */}
      {orders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-accent-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
                <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Current Points Balance
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Available for redemption
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {customerInfo?.loyalty_points || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                points available
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Total Points Earned (Historical) */}
      {orders.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                <Star className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300">
                  Total Points Earned
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  From {orders.length} order{orders.length !== 1 ? 's' : ''} (including redeemed)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                {orders.reduce((total, order) => total + calculatePointsEarned(order.final_amount), 0)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                points earned
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderHistory; 