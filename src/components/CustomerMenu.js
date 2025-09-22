import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, X, Search, User, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Gift, Star, ChevronDown, ChevronUp, Utensils, Coffee, Pizza, Sandwich, Salad, Cake, Wine, Heart, Sparkles, TrendingUp, Award, Zap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import CustomerOrderHistory from './CustomerOrderHistory';
import { getImageUrl, getPlaceholderImage, getCategoryBackground } from '../utils/imageUtils';

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
  setShowLoginModal,
  onCustomerUpdate
}) => {
  const { formatCurrency } = useCurrency();
  const { cafeSettings } = useCafeSettings();
  const { isDarkMode } = useDarkMode();
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
  const [tableNumber, setTableNumber] = useState('');

  // Helper function to ensure price is a number
  const ensureNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Get category icon based on category name
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('burger') || name.includes('sandwich')) return <Sandwich className="h-6 w-6" />;
    if (name.includes('pizza')) return <Pizza className="h-6 w-6" />;
    if (name.includes('salad') || name.includes('vegetable')) return <Salad className="h-6 w-6" />;
    if (name.includes('dessert') || name.includes('cake')) return <Cake className="h-6 w-6" />;
    if (name.includes('coffee') || name.includes('tea') || name.includes('drink')) return <Wine className="h-6 w-6" />;
    return <Utensils className="h-6 w-6" />;
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
      setTaxRate(settings.tax_rate || 0);
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
        { code: 'cash', name: 'Cash', icon: '₹' },
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
    }
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
        tableNumber: tableNumber,
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

      const response = await axios.post('/customer/orders', orderData);

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

      // Update customer points after successful order
      if (customer.phone) {
        try {
          const customerResponse = await axios.post('/customer/login', { phone: customer.phone });
          if (customerResponse.data) {
            // Update the customer data with new points
            const updatedCustomer = {
              ...customer,
              loyalty_points: customerResponse.data.loyalty_points
            };
            // Update customer data in parent component
            if (onCustomerUpdate) {
              onCustomerUpdate(updatedCustomer);
            }
          }
        } catch (error) {
          console.error('Error updating customer points:', error);
        }
      }

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
    setTableNumber('');
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <Utensils className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-orange-300 opacity-20"></div>
          </div>
          <p className="mt-6 text-xl font-medium text-gray-700">Loading delicious menu...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing something amazing for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Modern Floating Header */}
      <header className="fixed top-4 left-4 right-4 z-50 backdrop-blur-2xl bg-white/90 border border-white/20 shadow-2xl rounded-2xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                  {cafeSettings?.cafe_logo ? (
                    <img
                      src="/images/palm-cafe-logo.png"
                      alt="Palm Cafe"
                      className="h-6 w-6"
                    />
                  ) : (
                    <Utensils className="h-6 w-6 text-white" />
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                  {cafeSettings?.cafe_name || 'Palm Cafe'}
                </h1>
                <p className="text-xs text-gray-500">Culinary Excellence</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Customer Info */}
              {customer && (
                <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full px-4 py-2 border border-blue-100">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-gray-800">{customer.name}</p>
                    <p className="text-gray-600 flex items-center">
                      <Star className="h-2 w-2 text-yellow-500 mr-1" />
                      {customer.loyalty_points || 0} pts
                    </p>
                  </div>
                </div>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white p-3 rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Landing Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 text-center px-4 pt-20">
          {/* Welcome Badge */}
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30 shadow-lg mb-8">
            <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Welcome to Culinary Excellence</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Discover
            </span>
            <br />
            <span className="text-gray-800">Extraordinary</span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Flavors
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Embark on a culinary journey where every dish tells a story of passion,
            creativity, and the finest ingredients crafted to perfection.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => {
                document.getElementById('menu-section').scrollIntoView({
                  behavior: 'smooth'
                });
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
            >
              <span>Explore Menu</span>
              <ChevronDown className="ml-2 h-5 w-5 group-hover:translate-y-1 transition-transform" />
            </button>
            {customer && (
              <button
                onClick={() => setActiveTab('history')}
                className="bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-semibold border border-white/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                Order History
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: <TrendingUp className="h-6 w-6" />, title: `${Object.values(groupedMenuItems).flat().length}+`, subtitle: "Dishes", color: "from-blue-500 to-cyan-500" },
              { icon: <Award className="h-6 w-6" />, title: "4.9★", subtitle: "Rating", color: "from-yellow-500 to-orange-500" },
              { icon: <Clock className="h-6 w-6" />, title: "15 min", subtitle: "Prep Time", color: "from-green-500 to-emerald-500" },
              { icon: <Zap className="h-6 w-6" />, title: "Fresh", subtitle: "Daily", color: "from-purple-500 to-pink-500" }
            ].map((stat, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:scale-105 transition-transform duration-300 text-center">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center text-white mb-4 mx-auto`}>
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.title}</h3>
                <p className="text-sm text-gray-600">{stat.subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="menu-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Order Status Display */}
        {activeTab === 'menu' && recentOrder && (
          <div
            className="mb-12 p-8 bg-gradient-to-r from-blue-50 to-purple-50 backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-100 cursor-pointer hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] relative overflow-hidden group"
            onClick={() => {
              setActiveTab('history');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    Order #{recentOrder.orderNumber}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Placed on {recentOrder.timestamp.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-6 py-3 rounded-2xl text-sm font-bold shadow-lg ${orderStatus === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                    orderStatus === 'preparing' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                      orderStatus === 'ready' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' :
                        orderStatus === 'completed' ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' :
                          'bg-gradient-to-r from-red-500 to-red-600 text-white'
                  }`}>
                  {orderStatus?.charAt(0).toUpperCase() + orderStatus?.slice(1) || 'Pending'}
                </span>
                <p className="text-2xl font-bold text-gray-800 mt-3">
                  {formatCurrency(recentOrder.total)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'menu' ? (
          <>
            {/* Modern Search Section */}
            <div className="mb-16">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-800 mb-4">
                  Find Your Perfect
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Dish</span>
                </h2>
                <p className="text-gray-600 text-lg">Discover flavors that speak to your soul</p>
              </div>

              <div className="relative max-w-3xl mx-auto">
                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-3 border border-white/30">
                  <div className="relative">
                    <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                    <input
                      type="text"
                      placeholder="What are you craving today?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-16 pr-16 py-6 bg-transparent border-0 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-0 text-xl font-medium rounded-3xl"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
                {searchQuery && (
                  <div className="text-center mt-6">
                    <div className="inline-flex items-center bg-blue-50 rounded-full px-6 py-3 border border-blue-100">
                      <span className="text-blue-700 font-semibold">
                        {Object.values(filteredMenuItems).flat().length} delicious matches found
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tax Information */}
            {taxRate > 0 && (
              <div className="mb-12 text-center">
                <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl px-6 py-3 border border-blue-100">
                  <span className="text-gray-700 font-medium">
                    All prices include {taxRate}% tax
                  </span>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-20">
              {Object.keys(filteredMenuItems).length === 0 && searchQuery ? (
                <div className="text-center py-20 bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-sm rounded-3xl border border-white/30 shadow-2xl">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 mb-4">
                    No culinary matches found
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    Let's explore other delicious possibilities from our menu
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Explore All Dishes
                  </button>
                </div>
              ) : (
                Object.entries(filteredMenuItems).map(([categoryName, items], index) => (
                  <section key={categoryName} className="space-y-8">
                    {/* Category Header */}
                    <div className="text-center mb-12">
                      <div className="inline-flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-3xl px-8 py-6 border border-white/30 shadow-xl">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
                          {getCategoryIcon(categoryName)}
                        </div>
                        <div className="text-left">
                          <h2 className="text-4xl font-bold text-gray-800">{categoryName}</h2>
                          <p className="text-gray-600 text-lg">{items.length} handcrafted specialties</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {items.map((item, itemIndex) => (
                        <div
                          key={item.id}
                          className="group bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] border border-white/30 relative"
                          style={{ animationDelay: `${itemIndex * 100}ms` }}
                        >
                          {/* Image Section */}
                          <div className="relative overflow-hidden h-56">
                            {cafeSettings?.show_menu_images && item.image_url ? (
                              <img
                                src={getImageUrl(item.image_url)}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${getCategoryBackground(categoryName)} flex items-center justify-center relative`}>
                                <div className="text-center">
                                  <div className="w-20 h-20 mx-auto mb-3 text-white/80">
                                    {getCategoryIcon(categoryName)}
                                  </div>
                                  <div className="text-sm text-white/70 font-medium">
                                    {categoryName}
                                  </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                              </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Quick Add Button */}
                            <button
                              onClick={() => addToCart(item)}
                              className="absolute bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 rounded-2xl opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-300 shadow-2xl"
                            >
                              <Plus className="h-5 w-5" />
                            </button>

                            {/* Price Badge */}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg">
                              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>

                          {/* Content Section */}
                          <div className="p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                              {item.name}
                            </h3>

                            {item.description && (
                              <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Action Button */}
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                            >
                              <Plus className="h-5 w-5" />
                              <span>Add to Cart</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>

  {/* Features Section */}
  <section className="mt-20 py-16 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-300/10 rounded-full blur-3xl"></div>
              </div>
              <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
                <h2 className="text-4xl font-bold mb-8">Why Choose Palm Cafe?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: <Utensils className="h-12 w-12" />,
                      title: "Fresh Ingredients",
                      description: "Locally sourced, fresh ingredients prepared daily"
                    },
                    {
                      icon: <Clock className="h-12 w-12" />,
                      title: "Quick Service",
                      description: "Fast preparation without compromising quality"
                    },
                    {
                      icon: <Heart className="h-12 w-12" />,
                      title: "Made with Love",
                      description: "Every dish crafted with passion and care"
                    }
                  ].map((feature, index) => (
                    <div key={index} className="text-center group">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-orange-100">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section >
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
      </main >

  {/* Modern Cart Modal */ }
{
  showCart && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-3xl border border-white/30">
        {/* Cart Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Culinary Selection</h2>
                <p className="text-blue-100 text-sm">{cart.length} handpicked items</p>
              </div>
            </div>
            <button
              onClick={() => setShowCart(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-2xl transition-all duration-300 hover:scale-105"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Cart Content */}
        <div className="p-8 max-h-96 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Your cart awaits</h3>
              <p className="text-gray-600">Discover amazing dishes to fill your culinary journey</p>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl p-6 border border-blue-100/50 hover:shadow-lg transition-all duration-300">
                  {cafeSettings?.show_menu_images && item.image_url ? (
                    <img
                      src={getImageUrl(item.image_url)}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-2xl shadow-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center shadow-lg">
                      <Utensils className="h-10 w-10 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">{item.name}</h4>
                    <p className="text-gray-600">{formatCurrency(item.price)} each</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-10 h-10 bg-white/80 hover:bg-white rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md"
                    >
                      <Minus className="h-5 w-5 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg text-gray-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-lg"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="border-t border-blue-100/50 p-8 bg-gradient-to-r from-blue-50/30 to-purple-50/30 backdrop-blur-sm">
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-700 text-lg">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(getSubtotal())}</span>
              </div>
              {showTaxInMenu && taxAmount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {tipAmount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Tip:</span>
                  <span className="font-semibold">{formatCurrency(tipAmount)}</span>
                </div>
              )}
              {pointsToRedeem > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Points Redeemed ({pointsToRedeem} pts):</span>
                  <span className="font-semibold">-{formatCurrency(pointsToRedeem * 0.1)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold text-gray-900 border-t border-blue-200 pt-4">
                <span>Total:</span>
                <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                  {formatCurrency(getTotal())}
                </span>
              </div>
            </div>

            {/* Login Required Message */}
            {!customer && cart.length > 0 && (
              <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-3xl shadow-lg">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Join Our Culinary Community
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Login to place your order and start earning delicious loyalty rewards.
                  </p>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowLoginModal(true);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    Login & Continue
                  </button>
                </div>
              </div>
            )}

            {/* Customer sections only show when logged in */}
            {customer && (
              <>
                {/* Customer Information */}
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl border border-blue-200/50 shadow-lg">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Name:</span>
                      <span className="font-bold text-gray-900">{customer.name}</span>
                    </div>
                    {customer.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Phone:</span>
                        <span className="font-bold text-gray-900">{customer.phone}</span>
                      </div>
                    )}
                    {customer.loyalty_points > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Loyalty Points:</span>
                        <span className="flex items-center text-yellow-600 font-bold">
                          <Star className="h-5 w-5 mr-1" />
                          {customer.loyalty_points}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Payment Method</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.code}
                        type="button"
                        onClick={() => setPaymentMethod(method.code)}
                        className={`flex items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${paymentMethod === method.code
                            ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white border-transparent shadow-xl scale-105'
                            : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-white hover:shadow-lg hover:scale-102'
                          }`}
                      >
                        <span className="mr-2 text-lg">{method.icon}</span>
                        <span className="font-semibold">{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pickup Option */}
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Dining Preference</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'pickup', label: 'Pickup', desc: 'Collect from counter', icon: '🥡' },
                      { value: 'dine-in', label: 'Dine-in', desc: 'Serve at table', icon: '🍽️' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setPickupOption(option.value)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${pickupOption === option.value
                            ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white border-transparent shadow-xl scale-105'
                            : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-white hover:shadow-lg hover:scale-102'
                          }`}
                      >
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-2">{option.icon}</span>
                          <div className="font-bold">{option.label}</div>
                        </div>
                        <div className="text-sm opacity-80">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Number for Dine-in */}
                {pickupOption === 'dine-in' && (
                  <div className="mb-8">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Table Number</h3>
                    <input
                      type="text"
                      placeholder="Enter your table number (optional)"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/90 backdrop-blur-sm transition-all duration-300 text-lg font-medium"
                    />
                  </div>
                )}

                {/* Points Redemption */}
                {customer?.loyalty_points > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3">
                        <Star className="h-4 w-4 text-white" />
                      </div>
                      Redeem Loyalty Points
                    </h3>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-4 border border-yellow-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">{customer.loyalty_points}</div>
                          <div className="text-gray-600">Available Points</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">{maxRedeemablePoints}</div>
                          <div className="text-gray-600">Max Redeemable</div>
                        </div>
                      </div>
                      <div className="text-center mt-3 text-sm text-gray-600">
                        1 point = ₹0.10 discount
                      </div>
                    </div>
                    <input
                      type="number"
                      value={pointsToRedeem}
                      onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                      min="0"
                      max={maxRedeemablePoints}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-500 bg-white/90 backdrop-blur-sm transition-all duration-300 text-lg font-medium"
                      placeholder="Enter points to redeem"
                    />
                  </div>
                )}

                {/* Tip Selection */}
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Show Your Appreciation</h3>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[0, 10, 15, 18, 20, 25].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => handleTipPercentageChange(percentage)}
                        className={`py-3 px-4 text-sm rounded-2xl border-2 transition-all duration-300 font-semibold ${tipPercentage === percentage
                            ? 'bg-gradient-to-r from-blue-600 to-purple-700 text-white border-transparent shadow-lg scale-105'
                            : 'bg-white/80 text-gray-700 border-gray-200 hover:bg-white hover:shadow-md hover:scale-102'
                          }`}
                      >
                        {percentage === 0 ? 'No Tip' : `${percentage}%`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={tipAmount.toFixed(2)}
                    onChange={(e) => handleTipAmountChange(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/90 backdrop-blur-sm transition-all duration-300 text-lg font-medium"
                    placeholder="Custom tip amount"
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {customer ? (
                <>
                  <button
                    onClick={placeOrder}
                    disabled={orderLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-5 rounded-3xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {orderLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        <span>Creating Your Order...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6" />
                        <span>Place Order</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full bg-white/80 text-gray-700 py-4 rounded-3xl font-semibold hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
                  >
                    Clear Cart
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-5 rounded-3xl font-bold text-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <User className="h-6 w-6" />
                    <span>Login to Place Order</span>
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full bg-white/80 text-gray-700 py-4 rounded-3xl font-semibold hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
                  >
                    Clear Cart
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

{/* Modern Floating Cart Button */ }
<div className="fixed bottom-8 right-8 z-40">
  <button
    onClick={() => setShowCart(true)}
    className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-5 rounded-2xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 group backdrop-blur-sm border border-white/20"
  >
    <div className="relative">
      <ShoppingCart className="h-7 w-7" />
      {cart.length > 0 && (
        <span className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full h-7 w-7 flex items-center justify-center animate-bounce shadow-lg">
          {cart.reduce((total, item) => total + item.quantity, 0)}
        </span>
      )}
    </div>
  </button>
</div>
    </div >
  );
};

export default CustomerMenu;