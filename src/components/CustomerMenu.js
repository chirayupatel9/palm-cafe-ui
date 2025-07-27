import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, X, Star, User, Phone, Mail, Search } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { getCategoryColor } from '../utils/categoryColors';
import CustomerOrderHistory from './CustomerOrderHistory';

const CustomerMenu = ({ 
  customer, 
  cart, 
  setCart, 
  activeTab, 
  setActiveTab, 
  showCart, 
  setShowCart,
  onAddToCart,
  onPlaceOrder,
  showLoginModal,
  setShowLoginModal
}) => {
  const { formatCurrency } = useCurrency();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [tipAmount, setTipAmount] = useState(0);
  const [tipPercentage, setTipPercentage] = useState(0);
  const [orderLoading, setOrderLoading] = useState(false);
  const [groupedMenuItems, setGroupedMenuItems] = useState({});
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [showTaxInMenu, setShowTaxInMenu] = useState(true);
  const [orderStatus, setOrderStatus] = useState(null);
  const [recentOrder, setRecentOrder] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [maxRedeemablePoints, setMaxRedeemablePoints] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMenuItems, setFilteredMenuItems] = useState({});
  const [pickupOption, setPickupOption] = useState('pickup');

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Fetch menu items, tax settings, and payment methods
  useEffect(() => {
    fetchMenuItems();
    fetchTaxSettings();
    fetchPaymentMethods();
  }, []);

  // Filter menu items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMenuItems(groupedMenuItems);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = {};

    Object.entries(groupedMenuItems).forEach(([categoryName, items]) => {
      const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        item.category_name.toLowerCase().includes(query)
      );

      if (filteredItems.length > 0) {
        filtered[categoryName] = filteredItems;
      }
    });

    setFilteredMenuItems(filtered);
  }, [searchQuery, groupedMenuItems]);

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
      const response = await axios.get('/tax-settings/menu');
      const settings = response.data;
      setShowTaxInMenu(settings.show_tax_in_menu);
      
      // Only fetch tax rate if we need to show it
      if (settings.show_tax_in_menu) {
        const taxResponse = await axios.get('/tax-settings');
        const taxSettings = taxResponse.data;
        setTaxRate(taxSettings.tax_rate || 0);
      } else {
        setTaxRate(0);
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      setShowTaxInMenu(false);
      setTaxRate(0);
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

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/payment-methods');
      setPaymentMethods(response.data);
      
      // Set default payment method to first available one
      if (response.data.length > 0) {
        setPaymentMethod(response.data[0].code);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Fallback to default payment methods
      setPaymentMethods([
        { code: 'cash', name: 'Cash', icon: '💵' },
        { code: 'upi', name: 'UPI', icon: '📱' }
      ]);
    }
  };

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



  // Add item to cart
  const addToCart = (item) => {
    if (onAddToCart) {
      onAddToCart(item);
    } else {
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
    }
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

    if (!customer || !customer.name) {
      if (onPlaceOrder) {
        onPlaceOrder();
      } else {
        toast.error('Customer information is required. Please contact support.');
      }
      return;
    }



    setOrderLoading(true);

    try {
      const orderData = {
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerEmail: customer.email || '',
        paymentMethod: paymentMethod,
        pickupOption: pickupOption,
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
      
      // No auto-download - just show success message
      // PDF can be generated on-demand using the new endpoint

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
      setPickupOption('pickup');
      
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
    setPickupOption('pickup');
    toast.success('Cart cleared');
  };

  // Check order status
  const checkOrderStatus = async (orderNumber) => {
    try {
      const response = await axios.get(`/customer/orders?customer_phone=${customer?.phone}`);
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
            {/* Search Box */}
            <div className="mb-8">
              <div className="relative max-w-md mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search for food, drinks, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="text-center mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Object.values(filteredMenuItems).flat().length} items found
                  </p>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="space-y-8">
              {Object.keys(filteredMenuItems).length === 0 && searchQuery ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No items found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try searching for something else or browse all categories
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                Object.entries(filteredMenuItems).map(([categoryName, items], index) => {
                  const categoryColor = getCategoryColor(categoryName, index);
                  return (
                    <div key={categoryName} className={`border ${categoryColor.border} rounded-xl p-6 ${categoryColor.bg} shadow-sm`}>
                      <h3 className={`text-2xl font-bold ${categoryColor.text} mb-6 flex items-center`}>
                        <span className="mr-3">{categoryColor.icon}</span>
                        {categoryName}
                      </h3>
                                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {items.map((item) => (
                           <button
                             key={item.id}
                             onClick={() => addToCart(item)}
                             className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-105 text-left"
                           >
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
                               
                               <div className="flex items-center justify-center text-secondary-500 dark:text-secondary-400">
                                 <Plus className="h-4 w-4 mr-2" />
                                 <span className="text-sm font-medium">Click to add</span>
                               </div>
                             </div>
                           </button>
                         ))}
                       </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Order History Tab */
                          <CustomerOrderHistory 
                            customerPhone={customer?.phone} 
                            setActiveTab={setActiveTab}
                            cart={cart}
                            setCart={setCart}
                          />
        )}
      </main>

             {/* Floating Cart Button */}
       <button
         onClick={() => setShowCart(true)}
         className="fixed bottom-6 right-6 bg-secondary-500 text-white p-4 rounded-full shadow-lg hover:bg-secondary-600 transition-all duration-200 hover:scale-110 z-40"
       >
         <div className="relative">
           <ShoppingCart className="h-6 w-6" />
           {cart.length > 0 && (
             <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
               {cart.length}
             </span>
           )}
         </div>
       </button>

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

              {/* Login Required Message */}
              {!customer && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-yellow-800 mb-2">
                      Login Required
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      Please login to view your cart and place orders.
                    </p>
                    <button
                      onClick={() => {
                        setShowCart(false);
                        setShowLoginModal(true);
                      }}
                      className="bg-secondary-500 text-white px-4 py-2 rounded-lg hover:bg-secondary-600 transition-colors"
                    >
                      Login Now
                    </button>
                  </div>
                </div>
              )}

              {/* Cart Content - Only show when logged in */}
              {customer && (
                <>
                  {/* Customer Information */}
                  <div className="mb-6">
                    <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Customer Information</h3>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {customer?.name || 'Not provided'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {customer?.phone || 'Not provided'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                            {customer?.email || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {customer && customer.loyalty_points > 0 && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg mt-3">
                        <div className="flex items-center text-sm text-green-700">
                          <Star className="h-4 w-4 mr-2" />
                          <span>Welcome back! {customer.loyalty_points} loyalty points available</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Cart Content - Only show when logged in */}
              {customer && (
                <>
                  {/* Payment Method */}
                  <div className="mb-6">
                    <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.code}
                          type="button"
                          onClick={() => setPaymentMethod(method.code)}
                          className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                            paymentMethod === method.code
                              ? 'bg-secondary-500 text-white border-secondary-500'
                              : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                          }`}
                        >
                          <span className="mr-2">{method.icon}</span>
                          <span className="font-medium">{method.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Payment Option - Hidden for customers */}

                  {/* Pickup Option */}
                  <div className="mb-6">
                    <h3 className="font-medium text-secondary-700 dark:text-secondary-300 mb-3">Pickup Option</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPickupOption('pickup')}
                        className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                          pickupOption === 'pickup'
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                        }`}
                      >
                        <span className="mr-2">🏪</span>
                        <span className="font-medium">Pickup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPickupOption('dine-in')}
                        className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                          pickupOption === 'dine-in'
                            ? 'bg-secondary-500 text-white border-secondary-500'
                            : 'bg-white text-secondary-700 border-accent-300 hover:bg-accent-50'
                        }`}
                      >
                        <span className="mr-2">🍽️</span>
                        <span className="font-medium">Dine-in</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {pickupOption === 'pickup' 
                        ? 'Your order will be ready for pickup at the counter' 
                        : 'Your order will be served at your table'}
                    </p>
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
                        {showTaxInMenu && taxAmount > 0 && (
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu; 