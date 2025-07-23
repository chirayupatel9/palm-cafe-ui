import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, X, Star, User, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { getCategoryColor } from '../utils/categoryColors';
import CustomerOrderHistory from './CustomerOrderHistory';

const CustomerMenu = ({ customer, cart, setCart, activeTab, setActiveTab, showCart, setShowCart }) => {
  const { formatCurrency } = useCurrency();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(customer);
  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  const [groupedMenuItems, setGroupedMenuItems] = useState({});
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [orderStatus, setOrderStatus] = useState(null);
  const [recentOrder, setRecentOrder] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState(0);

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Fetch menu items and tax settings
  useEffect(() => {
    fetchMenuItems();
    fetchTaxSettings();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/menu');
      setMenuItems(response.data);
      
      // Group menu items by category
      const grouped = response.data.reduce((groups, item) => {
        const categoryName = item.category_name || 'Uncategorized';
        if (!groups[categoryName]) {
          groups[categoryName] = [];
        }
        groups[categoryName].push(item);
        return groups;
      }, {});
      setGroupedMenuItems(grouped);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // Fetch tax settings
  const fetchTaxSettings = async () => {
    try {
      const response = await axios.get('/tax-settings');
      const settings = response.data;
      setTaxRate(settings.tax_rate || 0);
    } catch (error) {
      console.error('Error fetching tax settings:', error);
    }
  };

  // Calculate tax amount when cart changes
  useEffect(() => {
    const subtotal = getSubtotal();
    const calculatedTax = (subtotal * taxRate) / 100;
    setTaxAmount(calculatedTax);
  }, [cart, taxRate]);

  // Calculate max redeemable points when cart changes
  useEffect(() => {
    if (customer?.loyalty_points && cart.length > 0) {
      const subtotal = getSubtotal();
      const maxPoints = Math.min(customer.loyalty_points, Math.floor(subtotal * 10)); // Can't redeem more than order value
      setMaxRedeemablePoints(maxPoints);
      
      // Reset points to redeem if it exceeds max
      if (pointsToRedeem > maxPoints) {
        setPointsToRedeem(maxPoints);
      }
    } else {
      setMaxRedeemablePoints(0);
      setPointsToRedeem(0);
    }
  }, [cart, customer?.loyalty_points, pointsToRedeem]);

  // Calculate subtotal
  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (ensureNumber(item.price) * item.quantity), 0);
  };

  // Calculate total with tax, tip, and points redemption
  const getTotal = () => {
    const subtotal = getSubtotal();
    const pointsDiscount = pointsToRedeem * 0.1; // 1 point = 0.1 INR
    return subtotal + taxAmount + tipAmount - pointsDiscount;
  };

  // Search for existing customer
  const searchCustomer = async (phone) => {
    if (!phone || phone.length < 5) {
      setCustomerInfo(null);
      return;
    }

    try {
      const response = await axios.get(`/api/customer/login/${phone}`);
      if (response.data) {
        const customer = response.data;
        setCustomerInfo(customer);
        setCustomerName(customer.name);
        setCustomerEmail(customer.email || '');
        toast.success(`Welcome back, ${customer.name}! You have ${customer.loyalty_points} loyalty points.`);
      } else {
        setCustomerInfo(null);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      setCustomerInfo(null);
    }
  };

  // Add item to cart
  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    toast.success(`${item.name} added to cart`);
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Handle tip percentage change
  const handleTipPercentageChange = (percentage) => {
    setTipPercentage(percentage);
    const subtotal = getSubtotal();
    const newTipAmount = (subtotal * percentage) / 100;
    setTipAmount(newTipAmount);
  };

  // Handle custom tip amount
  const handleTipAmountChange = (amount) => {
    const newAmount = ensureNumber(amount);
    setTipAmount(newAmount);
    
    const subtotal = getSubtotal();
    if (subtotal > 0) {
      const newPercentage = (newAmount / subtotal) * 100;
      setTipPercentage(newPercentage);
    } else {
      setTipPercentage(0);
    }
  };

  // Handle points redemption
  const handlePointsRedemption = (points) => {
    const newPoints = Math.min(Math.max(0, points), maxRedeemablePoints);
    setPointsToRedeem(newPoints);
  };

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart first');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setOrderLoading(true);

    try {
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: ensureNumber(item.price),
          quantity: item.quantity,
          total: ensureNumber(item.price) * item.quantity
        })),
        tipAmount: tipAmount,
        pointsRedeemed: pointsToRedeem,
        date: new Date().toISOString()
      };

      const response = await axios.post('/invoices', orderData);
      
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

      // Set recent order and status
      const orderNumber = response.data.orderNumber;
      setRecentOrder({
        orderNumber,
        items: cart,
        total: getTotal(),
        status: 'pending',
        timestamp: new Date()
      });
      setOrderStatus('pending');
      
      // Clear cart and form
      setCart([]);
      setShowCart(false);
      setTipAmount(0);
      setTipPercentage(0);
      setPointsToRedeem(0);
      
      const successMessage = orderNumber 
        ? `Order placed successfully! Order #${orderNumber}`
        : 'Order placed successfully!';
      toast.success(successMessage);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setOrderLoading(false);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setTipAmount(0);
    setTipPercentage(0);
    toast.success('Cart cleared');
  };

  // Check order status
  const checkOrderStatus = async (orderNumber) => {
    try {
      const response = await axios.get(`/customer/orders?customer_phone=${customerPhone}`);
      const order = response.data.find(o => o.order_number === orderNumber);
      if (order) {
        setOrderStatus(order.status);
        if (recentOrder) {
          setRecentOrder(prev => ({ ...prev, status: order.status }));
        }
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    }
  };

  // Check order status periodically if there's a recent order
  useEffect(() => {
    if (recentOrder && orderStatus === 'pending') {
      const interval = setInterval(() => {
        checkOrderStatus(recentOrder.orderNumber);
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [recentOrder, orderStatus]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent-50 dark:bg-gray-900">
        <img 
          src="/images/palm-cafe-logo.png" 
          alt="Palm Cafe Logo" 
          className="h-16 w-16 mb-4"
        />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500"></div>
        <p className="mt-4 text-secondary-600 dark:text-gray-400">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-gray-900">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary-700 dark:text-secondary-300 mb-2">
            Welcome to Palm Cafe
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Browse our delicious menu and place your order
            {taxRate > 0 && (
              <span className="block text-sm text-green-600 mt-1">
                Tax rate: {taxRate}%
              </span>
            )}
          </p>
        </div>



        {/* Order Status Display - Only show on menu tab */}
        {activeTab === 'menu' && recentOrder && (
          <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-secondary-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                  Order #{recentOrder.orderNumber}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Placed on {recentOrder.timestamp.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  orderStatus === 'preparing' ? 'bg-blue-100 text-blue-800' :
                  orderStatus === 'ready' ? 'bg-green-100 text-green-800' :
                  orderStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {orderStatus?.charAt(0).toUpperCase() + orderStatus?.slice(1) || 'Pending'}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total: {formatCurrency(recentOrder.total)}
                </p>
                <div className="flex items-center justify-end mt-1">
                  <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                    <Star className="h-3 w-3 mr-1" />
                    <span>+{Math.floor(recentOrder.total / 10)} pts</span>
                  </div>
                </div>
              </div>
            </div>
            {orderStatus === 'ready' && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-medium">
                  🎉 Your order is ready! Please collect it from the counter.
                </p>
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setRecentOrder(null);
                  setOrderStatus(null);
                }}
                className="text-sm text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300"
              >
                Start New Order
              </button>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'menu' ? (
          <>
            {/* Menu Items */}
            <div className="space-y-8">
              {Object.entries(groupedMenuItems).map(([categoryName, items], index) => {
                const categoryColor = getCategoryColor(categoryName, index);
                return (
                  <div key={categoryName} className={`border ${categoryColor.border} rounded-xl p-6 ${categoryColor.bg} shadow-sm`}>
                    <h3 className={`text-2xl font-bold ${categoryColor.text} mb-6 flex items-center`}>
                      <span className="mr-3">{categoryColor.icon}</span>
                      {categoryName}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">
                                {item.name}
                              </h4>
                              <span className="text-lg font-bold text-secondary-600 dark:text-secondary-400">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                            
                            {item.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                {item.description}
                              </p>
                            )}
                            
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full bg-secondary-500 text-white py-2 px-4 rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-center"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Order History Tab */
          <CustomerOrderHistory customerPhone={customerPhone} setActiveTab={setActiveTab} />
        )}
      </main>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-secondary-700 dark:text-secondary-300">
                  Your Order
                </h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Customer Information</h3>
                
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
                
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    searchCustomer(e.target.value);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />
                
                <input
                  type="email"
                  placeholder="Email Address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                />

                {customerInfo && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                    <div className="flex items-center text-sm text-green-700">
                      <Star className="h-4 w-4 mr-2" />
                      <span>Welcome back! {customerInfo.loyalty_points} loyalty points available</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Payment Method</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'Cash', icon: '💵' },
                    { value: 'card', label: 'Card', icon: '💳' },
                    { value: 'upi', label: 'UPI', icon: '📱' },
                    { value: 'online', label: 'Online', icon: '🌐' }
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setPaymentMethod(method.value)}
                      className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                        paymentMethod === method.value
                          ? 'bg-secondary-500 text-white border-secondary-500'
                          : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                      }`}
                    >
                      <span className="mr-2">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-accent-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-700">{item.name}</h4>
                        <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Points Redemption */}
              {cart.length > 0 && customer?.loyalty_points > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3 flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    Redeem Points
                    <span className="ml-2 text-sm text-gray-500">
                      (1 point = ₹0.10)
                    </span>
                  </h3>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Available Points:</span>
                      <span className="font-medium text-yellow-700 dark:text-yellow-300">
                        {customer.loyalty_points}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Max Redeemable:</span>
                      <span className="font-medium text-yellow-700 dark:text-yellow-300">
                        {maxRedeemablePoints} points
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Points to redeem:</span>
                    <input
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                      min="0"
                      max={maxRedeemablePoints}
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="0"
                    />
                  </div>
                  
                  {pointsToRedeem > 0 && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      You'll save: ₹{(pointsToRedeem * 0.1).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              {/* Tip Selection */}
              {cart.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Tip</h3>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[0, 10, 15, 18, 20, 25].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => handleTipPercentageChange(percentage)}
                        className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                          tipPercentage === percentage
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                        }`}
                      >
                        {percentage === 0 ? 'No Tip' : `${percentage}%`}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Custom:</span>
                    <input
                      type="number"
                      value={tipAmount.toFixed(2)}
                      onChange={(e) => handleTipAmountChange(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Order Summary */}
              {cart.length > 0 && (
                <div className="border-t border-accent-200 pt-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(getSubtotal())}</span>
                    </div>
                    {taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({taxRate}%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    {tipAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tip:</span>
                        <span>{formatCurrency(tipAmount)}</span>
                      </div>
                    )}
                    {pointsToRedeem > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>Points Redeemed ({pointsToRedeem} pts):</span>
                        <span>-{formatCurrency(pointsToRedeem * 0.1)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(getTotal())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {cart.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={placeOrder}
                    disabled={orderLoading}
                    className="w-full bg-secondary-500 text-white py-3 px-4 rounded-lg hover:bg-secondary-600 transition-colors disabled:opacity-50"
                  >
                    {orderLoading ? 'Placing Order...' : 'Place Order'}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu; 