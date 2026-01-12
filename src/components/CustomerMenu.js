import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, X, Search, User, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, Gift, Star, ChevronDown, ChevronUp, Utensils, Coffee, Pizza, Sandwich, Salad, Cake, Wine, Heart, Sparkles, TrendingUp, Award, Zap, LogOut, Edit3, Save, Calendar, Menu } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCurrency } from '../contexts/CurrencyContext';
import { useCafeSettings } from '../contexts/CafeSettingsContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import CustomerOrderHistory from './CustomerOrderHistory';
import CustomerProfile from './CustomerProfile';
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
  onCustomerUpdate,
  onLogout 
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const categoryScrollRef = useRef(null);
  const searchInputRef = useRef(null);

  // Edit profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({
    name: '',
    email: '',
    address: '',
    date_of_birth: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

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

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

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

  // Profile editing functions
  const openEditProfile = () => {
    if (customer) {
      setEditProfileData({
        name: customer.name || '',
        email: customer.email || '',
        address: customer.address || '',
        date_of_birth: customer.date_of_birth || ''
      });
      setShowEditProfile(true);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!customer) return;

    setProfileLoading(true);
    try {
      const response = await axios.put('/customer/profile', {
        id: customer.id,
        ...editProfileData
      });

      // Update customer data in parent component
      if (onCustomerUpdate) {
        onCustomerUpdate(response.data);
      }

      toast.success('Profile updated successfully!');
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileInputChange = (field, value) => {
    setEditProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <Utensils className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
          </div>
          <p className="mt-6 text-xl font-medium text-text-light dark:text-text-dark">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex flex-col min-h-screen bg-accent-50 dark:bg-gray-900">
      {/* Sticky Header / Top App Bar */}
      <header className="sticky top-0 z-20 w-full bg-white dark:bg-gray-800 shadow-sm border-b border-accent-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <Coffee className="text-secondary-600 dark:text-secondary-400 text-3xl h-8 w-8" />
              <h1 className="text-xl font-bold tracking-tight text-secondary-700 dark:text-gray-100">
                {cafeSettings?.cafe_name || 'Palm Cafe'}
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={() => setActiveTab('menu')}
                className={`text-sm font-medium transition-colors ${
                  activeTab === 'menu'
                    ? 'text-secondary-600 dark:text-secondary-400 font-semibold'
                    : 'text-secondary-500 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-secondary-300'
                }`}
              >
                Menu
              </button>
              {customer && (
                <button
                  onClick={() => setActiveTab('history')}
                  className={`text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'text-secondary-600 dark:text-secondary-400 font-semibold'
                      : 'text-secondary-500 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-secondary-300'
                  }`}
                >
                  My Orders
                </button>
              )}
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setSearchExpanded(true)}
                  className="flex items-center justify-center h-10 w-10 hover:bg-accent-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <Search className="h-5 w-5 text-secondary-600 dark:text-gray-300" />
                </button>

                {/* Expanded Search Bar - Absolute positioned overlay */}
                {searchExpanded && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 md:w-80 z-30">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search menu..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={(e) => {
                          // Don't close if clicking on the clear button
                          if (!e.relatedTarget?.closest('.search-clear-btn') && !searchQuery) {
                            setSearchExpanded(false);
                          }
                        }}
                        className="w-full pl-10 pr-10 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-secondary-300 dark:border-gray-600 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 shadow-lg transition-all"
                      />
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery('');
                          setSearchExpanded(false);
                        }}
                        className="search-clear-btn absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 dark:text-gray-400 hover:text-secondary-600 dark:hover:text-gray-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart */}
              <button
                onClick={() => setShowCart(true)}
                className="relative flex cursor-pointer items-center justify-center rounded-full h-10 w-10 text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary-500 text-xs font-bold text-white">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>

              {/* User Profile - Only show when logged in */}
              {customer && (
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-secondary-500 text-white hover:bg-secondary-600 transition-colors"
                  title={customer.name}
                >
                  <User className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column: Category Navigation (Desktop) */}
          {activeTab === 'menu' && (
            <aside className="hidden lg:block w-1/4 xl:w-1/5">
              <div className="sticky top-24">
                <h2 className="text-lg font-bold mb-4 px-3 text-secondary-700 dark:text-gray-100">Categories</h2>
                <nav className="flex flex-col gap-1">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors font-medium ${
                      selectedCategory === 'All'
                        ? 'bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 font-semibold'
                        : 'hover:bg-accent-100 dark:hover:bg-gray-700 text-secondary-600 dark:text-gray-400 hover:text-secondary-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <Utensils className="h-5 w-5" />
                    <span>All Items</span>
                  </button>
                  {Object.keys(groupedMenuItems).map((categoryName) => (
                    <button
                      key={categoryName}
                      onClick={() => setSelectedCategory(categoryName)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors font-medium ${
                        selectedCategory === categoryName
                          ? 'bg-secondary-100 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-300 font-semibold'
                          : 'hover:bg-accent-100 dark:hover:bg-gray-700 text-secondary-600 dark:text-gray-400 hover:text-secondary-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {getCategoryIcon(categoryName)}
                      <span>{categoryName}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Mobile Category Scroller */}
          {activeTab === 'menu' && (
            <div className="lg:hidden sticky top-16 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-accent-200 dark:border-gray-700">
              <div
                ref={categoryScrollRef}
                className="flex gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-5 pr-5 cursor-pointer transition-colors ${
                    selectedCategory === 'All'
                      ? 'bg-secondary-500 text-white'
                      : 'bg-accent-100 dark:bg-gray-700 text-secondary-700 dark:text-gray-200'
                  }`}
                >
                  <p className={`text-sm ${selectedCategory === 'All' ? 'font-bold' : 'font-medium'}`}>
                    All
                  </p>
                </button>
                {Object.keys(groupedMenuItems).map((categoryName) => (
                  <button
                    key={categoryName}
                    onClick={() => setSelectedCategory(categoryName)}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full pl-5 pr-5 cursor-pointer transition-colors ${
                      selectedCategory === categoryName
                        ? 'bg-secondary-500 text-white'
                        : 'bg-accent-100 dark:bg-gray-700 text-secondary-700 dark:text-gray-200'
                    }`}
                  >
                    <p className={`text-sm ${selectedCategory === categoryName ? 'font-bold' : 'font-medium'}`}>
                      {categoryName}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Center/Main Column: Menu Items or Order History */}
          <div className="w-full lg:flex-1">
            {activeTab === 'menu' ? (
              <div className="flex flex-col gap-10">
                {/* Menu Items by Category */}
                {Object.entries(groupedMenuItems)
                  .filter(([categoryName]) => selectedCategory === 'All' || categoryName === selectedCategory)
                  .map(([categoryName, items]) => (
                    <section key={categoryName} id={categoryName.toLowerCase().replace(/\s+/g, '-')}>
                      <h2 className="text-3xl font-extrabold tracking-tight mb-6 text-secondary-700 dark:text-gray-100">
                        {categoryName}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col rounded-xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden border border-accent-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                          >
                            <div
                              className="w-full h-48 bg-cover bg-center"
                              style={{
                                backgroundImage: `url('${
                                  item.image_url
                                    ? getImageUrl(item.image_url)
                                    : getPlaceholderImage(categoryName, item.name)
                                }')`
                              }}
                            />
                            <div className="p-4 flex flex-col flex-grow">
                              <h3 className="text-lg font-bold text-secondary-700 dark:text-gray-100">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-secondary-600 dark:text-gray-400 mt-1 flex-grow line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-lg font-semibold mt-3 text-secondary-700 dark:text-gray-100">
                                {formatCurrency(item.price)}
                              </p>
                              <div className="flex items-center justify-end mt-4">
                                <button
                                  onClick={() => addToCart(item)}
                                  className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-secondary-500 text-white text-sm font-bold hover:bg-secondary-600 transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
              </div>
            ) : (
              /* Order History Tab */
              <CustomerOrderHistory
                customerPhone={customer?.phone}
                setActiveTab={setActiveTab}
                cart={cart}
                setCart={setCart}
              />
            )}
          </div>
        </div>
      </main>

  {/* Cart Modal */ }
{
  showCart && (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Cart Header */}
        <div className="flex w-full items-center justify-between border-b border-accent-200 dark:border-gray-700 bg-accent-50 dark:bg-gray-900 px-6 py-4">
          <div class="flex items-center gap-4">
            <ShoppingCart className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
            <h2 className="text-2xl font-bold tracking-tight text-secondary-700 dark:text-gray-100">Your Order</h2>
          </div>
          <button
            onClick={() => setShowCart(false)}
            className="text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Content - Two Column Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 p-6 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 rounded-lg bg-accent-50 dark:bg-gray-900 p-12 text-center shadow-sm">
                <div className="text-secondary-600 dark:text-secondary-400">
                  <ShoppingCart className="h-24 w-24" />
                </div>
                <h3 className="text-2xl font-bold text-secondary-700 dark:text-gray-100">Your cart is empty</h3>
                <p className="max-w-sm text-secondary-600 dark:text-gray-400">Looks like you haven't added anything to your order yet. Let's fix that!</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-lg bg-accent-50 dark:bg-gray-900 p-4 shadow-sm border border-accent-200 dark:border-gray-700">
                    <div
                      className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-16"
                      style={{
                        backgroundImage: `url('${
                          item.image_url
                            ? getImageUrl(item.image_url)
                            : getPlaceholderImage(item.category_name, item.name)
                        }')`
                      }}
                    />
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-base font-bold text-secondary-700 dark:text-gray-100">{item.name}</p>
                      <p className="text-sm text-secondary-600 dark:text-gray-400">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 dark:bg-gray-700 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-900 cursor-pointer"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <input
                          className="w-8 border-none bg-transparent p-0 text-center text-base font-medium focus:outline-0 focus:ring-0 text-secondary-700 dark:text-gray-100"
                          type="number"
                          value={item.quantity}
                          readOnly
                        />
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 dark:bg-gray-700 transition-colors hover:bg-secondary-100 dark:hover:bg-secondary-900 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="w-16 text-right font-semibold text-secondary-700 dark:text-gray-100">{formatCurrency(item.price * item.quantity)}</p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-secondary-600 dark:text-gray-400 transition-colors hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Right Column: Order Summary */}
          {cart.length > 0 && (
            <div className="lg:col-span-1 flex flex-col max-h-full">
              <div className="flex flex-col gap-6 rounded-xl bg-accent-50 dark:bg-gray-900 p-6 shadow-sm border border-accent-200 dark:border-gray-700 flex-1 overflow-y-auto">
                <h2 className="text-2xl font-bold tracking-tight text-secondary-700 dark:text-gray-100">Order Summary</h2>

                <div className="flex flex-col gap-3 border-b border-accent-200 dark:border-gray-700 pb-4">
                  <div className="flex justify-between">
                    <p className="text-secondary-600 dark:text-gray-400">Subtotal</p>
                    <p className="font-medium text-secondary-700 dark:text-gray-100">{formatCurrency(getSubtotal())}</p>
                  </div>
                  {showTaxInMenu && taxAmount > 0 && (
                    <div className="flex justify-between">
                      <p className="text-secondary-600 dark:text-gray-400">Taxes ({taxRate}%)</p>
                      <p className="font-medium text-secondary-700 dark:text-gray-100">{formatCurrency(taxAmount)}</p>
                    </div>
                  )}
                  {tipAmount > 0 && (
                    <div className="flex justify-between">
                      <p className="text-secondary-600 dark:text-gray-400">Tip</p>
                      <p className="font-medium text-secondary-700 dark:text-gray-100">{formatCurrency(tipAmount)}</p>
                    </div>
                  )}
                  {pointsToRedeem > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <p>Points Redeemed ({pointsToRedeem} pts)</p>
                      <p className="font-medium">-{formatCurrency(pointsToRedeem * 0.1)}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <p className="text-lg font-bold text-secondary-700 dark:text-gray-100">Total</p>
                  <p className="text-xl font-extrabold text-secondary-700 dark:text-gray-100">{formatCurrency(getTotal())}</p>
                </div>

                {/* Login Required Message */}
                {!customer && (
                  <div className="p-6 bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 rounded-lg">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-secondary-700 dark:text-gray-100 mb-2">
                        Login Required
                      </h3>
                      <p className="text-secondary-600 dark:text-gray-400 mb-4 text-sm">
                        Please login to place your order
                      </p>
                      <button
                        onClick={() => {
                          setShowCart(false);
                          setShowLoginModal(true);
                        }}
                        className="w-full bg-secondary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-secondary-600 transition-colors"
                      >
                        Login & Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer sections only show when logged in */}
                {customer && (
                  <div className="flex flex-col gap-4">
                    {/* Customer Information */}
                    <div className="p-4 bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800 rounded-lg">
                      <div className="flex flex-col gap-2 mb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-secondary-700 dark:text-gray-100 flex items-center text-base">
                            <User className="h-4 w-4 mr-2 text-secondary-600 dark:text-secondary-400" />
                            Customer Info
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openEditProfile}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors text-xs flex-1"
                          >
                            <Edit3 className="h-3 w-3" />
                            <span>Edit Profile</span>
                          </button>
                          {onLogout && (
                            <button
                              onClick={onLogout}
                              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs flex-1"
                            >
                              <LogOut className="h-3 w-3" />
                              <span>Logout</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-secondary-600 dark:text-gray-400">Name:</span>
                          <span className="font-semibold text-secondary-700 dark:text-gray-100">{customer.name}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600 dark:text-gray-400">Phone:</span>
                            <span className="font-semibold text-secondary-700 dark:text-gray-100">{customer.phone}</span>
                          </div>
                        )}
                        {customer.loyalty_points > 0 && (
                          <div className="flex justify-between">
                            <span className="text-secondary-600 dark:text-gray-400">Points:</span>
                            <span className="flex items-center text-yellow-600 dark:text-yellow-400 font-semibold">
                              <Star className="h-3 w-3 mr-1" />
                              {customer.loyalty_points}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm">Payment Method</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {paymentMethods.map((method) => (
                          <button
                            key={method.code}
                            type="button"
                            onClick={() => setPaymentMethod(method.code)}
                            className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                              paymentMethod === method.code
                                ? 'bg-secondary-500 text-white border-secondary-500'
                                : 'bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 border-accent-200 dark:border-gray-700 hover:border-secondary-500'
                            }`}
                          >
                            <span className="mr-2">{method.icon}</span>
                            <span className="font-semibold text-sm">{method.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pickup Option */}
                    <div>
                      <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm">Dining Preference</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'pickup', label: 'Pickup', icon: '🥡' },
                          { value: 'dine-in', label: 'Dine-in', icon: '🍽️' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setPickupOption(option.value)}
                            className={`p-3 rounded-lg border-2 transition-colors ${
                              pickupOption === option.value
                                ? 'bg-secondary-500 text-white border-secondary-500'
                                : 'bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 border-accent-200 dark:border-gray-700 hover:border-secondary-500'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg">{option.icon}</span>
                              <span className="font-semibold text-sm">{option.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table Number for Dine-in */}
                    {pickupOption === 'dine-in' && (
                      <div>
                        <label className="block font-bold text-secondary-700 dark:text-gray-100 mb-2 text-sm">Table Number</label>
                        <input
                          type="text"
                          placeholder="Enter table number (optional)"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full p-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 transition-colors"
                        />
                      </div>
                    )}

                    {/* Points Redemption */}
                    {customer?.loyalty_points > 0 && (
                      <div>
                        <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm flex items-center">
                          <Star className="h-4 w-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                          Redeem Points
                        </h3>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-3 border border-yellow-200 dark:border-yellow-800">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="text-center">
                              <div className="text-lg font-bold text-secondary-700 dark:text-gray-100">{customer.loyalty_points}</div>
                              <div className="text-secondary-600 dark:text-gray-400">Available</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-secondary-700 dark:text-gray-100">{maxRedeemablePoints}</div>
                              <div className="text-secondary-600 dark:text-gray-400">Max Redeemable</div>
                            </div>
                          </div>
                          <div className="text-center mt-2 text-xs text-secondary-600 dark:text-gray-400">
                            1 point = {formatCurrency(0.10)}
                          </div>
                        </div>
                        <input
                          type="number"
                          value={pointsToRedeem}
                          onChange={(e) => handlePointsRedemption(parseInt(e.target.value) || 0)}
                          min="0"
                          max={maxRedeemablePoints}
                          className="w-full p-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 transition-colors"
                          placeholder="Enter points"
                        />
                      </div>
                    )}

                    {/* Tip Selection */}
                    <div>
                      <h3 className="font-bold text-secondary-700 dark:text-gray-100 mb-3 text-sm">Add Tip</h3>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[0, 10, 15, 18, 20, 25].map((percentage) => (
                          <button
                            key={percentage}
                            onClick={() => handleTipPercentageChange(percentage)}
                            className={`py-2 px-3 text-xs rounded-lg border-2 transition-colors font-semibold ${
                              tipPercentage === percentage
                                ? 'bg-secondary-500 text-white border-secondary-500'
                                : 'bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 border-accent-200 dark:border-gray-700 hover:border-secondary-500'
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
                        className="w-full p-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 transition-colors"
                        placeholder="Custom tip"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Sticky at bottom */}
              <div className="flex flex-col gap-3 p-4 bg-accent-50 dark:bg-gray-900 border-t border-accent-200 dark:border-gray-700 rounded-b-xl">
                <button
                  onClick={placeOrder}
                  disabled={orderLoading || !customer}
                  className="w-full rounded-lg bg-secondary-500 py-3 text-base font-bold text-white transition-opacity hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {orderLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Proceed to Checkout</span>
                    </>
                  )}
                </button>

                <button
                  onClick={clearCart}
                  className="w-full rounded-lg bg-white dark:bg-gray-800 border-2 border-accent-200 dark:border-gray-700 py-2.5 text-sm font-semibold text-secondary-700 dark:text-gray-100 hover:border-secondary-500 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

      {/* Floating Cart Summary Bar - Mobile Only */}
      {cart.length > 0 && (
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 border-t border-accent-200 dark:border-gray-700 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-secondary-600 dark:text-gray-400 text-sm font-medium">
                  {cart.reduce((total, item) => total + item.quantity, 0)} items
                </p>
                <p className="text-secondary-700 dark:text-gray-100 text-lg font-bold">
                  {formatCurrency(getSubtotal())}
                </p>
              </div>
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-secondary-500 h-12 px-6 hover:bg-secondary-600 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                <span className="text-white text-base font-bold">View Cart</span>
              </button>
            </div>
          </div>
        </footer>
      )}


      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between border-b border-accent-200 dark:border-gray-700 bg-accent-50 dark:bg-gray-900 px-6 py-4">
              <div className="flex items-center gap-4">
                <Edit3 className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
                <h2 className="text-2xl font-bold tracking-tight text-secondary-700 dark:text-gray-100">Edit Profile</h2>
              </div>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-secondary-600 dark:text-gray-300 hover:bg-accent-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editProfileData.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editProfileData.email}
                    onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Address
                  </label>
                  <textarea
                    value={editProfileData.address}
                    onChange={(e) => handleProfileInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100 resize-none"
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 dark:text-gray-100 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editProfileData.date_of_birth}
                    onChange={(e) => handleProfileInputChange('date_of_birth', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-accent-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors bg-white dark:bg-gray-800 text-secondary-700 dark:text-gray-100"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border-2 border-accent-200 dark:border-gray-700 text-secondary-700 dark:text-gray-100 rounded-lg font-medium hover:border-secondary-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="flex-1 px-4 py-3 bg-secondary-500 text-white rounded-lg font-medium hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {profileLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile - Full Page View */}
      {showProfile && customer && (
        <div className="fixed inset-0 z-50 bg-[#F5F5DC] dark:bg-[#1a1612]">
          <CustomerProfile
            customer={customer}
            onCustomerUpdate={onCustomerUpdate}
            onLogout={() => {
              setShowProfile(false);
              onLogout();
            }}
            onClose={() => setShowProfile(false)}
          />
        </div>
      )}
    </div >
  );
};

export default CustomerMenu;